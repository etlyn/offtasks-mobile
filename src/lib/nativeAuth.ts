import { createDeepLinkHandler } from '@etlyn/etlyn-auth/react-native';
import { URL, URLSearchParams } from 'react-native-url-polyfill';

export const GOOGLE_CALLBACK = 'offtasks://auth/callback';
type NativeAuthClient = {
  auth: {
    signInWithOAuth(options: {
      provider: 'google';
      options: { redirectTo: string; skipBrowserRedirect: true };
    }): Promise<{ data: { url: string | null }; error: unknown }>;
    exchangeCodeForSession(
      code: string,
    ): Promise<{ error: { status?: number; message?: string } | null }>;
  };
};
type AuthBrowser = {
  isAvailable(): Promise<boolean>;
  openAuth(
    url: string,
    callback: string,
    options: { ephemeralWebSession: false; showTitle: boolean },
  ): Promise<{ type: string; url?: string }>;
};

export function isNativeAuthCallback(url: URL) {
  return (
    url.protocol === 'offtasks:' &&
    url.hostname === 'auth' &&
    !url.username &&
    !url.password &&
    !url.port &&
    (url.pathname === '/callback' || url.pathname === '/recovery')
  );
}

/** The auth session and OS Linking may deliver the same callback. Exchange once
 * per URL in a bounded memory-only cache; never log or persist callback codes. */
export function createNativeAuth(options: {
  client: NativeAuthClient;
  origin: string;
  browser: AuthBrowser;
  openURL: (url: string) => Promise<unknown>;
}) {
  const callbacks = new Map<string, Promise<boolean>>();
  const exchange = createDeepLinkHandler({
    supabase: {
      auth: {
        exchangeCodeForSession: code =>
          options.client.auth.exchangeCodeForSession(code),
      },
    },
    validateUrl: url => isNativeAuthCallback(new URL(url.toString())),
  });
  const complete = (value: string): Promise<boolean> => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return Promise.resolve(false);
    }
    if (!isNativeAuthCallback(url)) return Promise.resolve(false);
    const cached = callbacks.get(value);
    if (cached) return cached;
    const operation = (async () => {
      const error =
        url.searchParams.get('error') ||
        new URLSearchParams(url.hash.slice(1)).get('error');
      if (error)
        throw new Error(
          error === 'access_denied'
            ? 'Google sign-in was canceled. Please try again.'
            : 'Sign-in could not be completed. Please try again.',
        );
      return exchange(value);
    })();
    callbacks.set(value, operation);
    if (callbacks.size > 8) callbacks.delete(callbacks.keys().next().value!);
    return operation;
  };
  return {
    complete,
    async startGoogle(): Promise<'signed-in' | 'canceled' | 'external'> {
      const { data, error } = await options.client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: GOOGLE_CALLBACK, skipBrowserRedirect: true },
      });
      if (error || !data?.url)
        throw new Error('Unable to start Google sign-in. Please try again.');
      const url = new URL(data.url);
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.origin !== new URL(options.origin).origin ||
        url.pathname !== '/auth/v1/authorize' ||
        url.searchParams.get('provider') !== 'google'
      ) {
        throw new Error('Unable to start Google sign-in. Please try again.');
      }
      if (!(await options.browser.isAvailable())) {
        await options.openURL(data.url);
        return 'external';
      }
      const result = await options.browser.openAuth(data.url, GOOGLE_CALLBACK, {
        ephemeralWebSession: false,
        showTitle: true,
      });
      if (result.type === 'cancel' || result.type === 'dismiss')
        return 'canceled';
      if (
        result.type !== 'success' ||
        !result.url ||
        new URL(result.url).pathname !== '/callback' ||
        !(await complete(result.url))
      ) {
        throw new Error('Sign-in could not be completed. Please try again.');
      }
      return 'signed-in';
    },
  };
}
