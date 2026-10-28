import 'react-native-url-polyfill/auto';
import { createNativeAuth, GOOGLE_CALLBACK } from '../src/lib/nativeAuth';

function fixture() {
  const client = {
    auth: {
      signInWithOAuth: jest
        .fn()
        .mockResolvedValue({
          data: {
            url: 'https://fixture.supabase.co/auth/v1/authorize?provider=google',
          },
          error: null,
        }),
      exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
    },
  };
  const browser = {
    isAvailable: jest.fn().mockResolvedValue(true),
    openAuth: jest
      .fn()
      .mockResolvedValue({
        type: 'success',
        url: GOOGLE_CALLBACK + '?code=fixture',
      }),
  };
  const openURL = jest.fn().mockResolvedValue(undefined);
  return {
    client,
    browser,
    openURL,
    auth: createNativeAuth({
      client,
      browser,
      openURL,
      origin: 'https://fixture.supabase.co',
    }),
  };
}
test('Google opens a system authentication session with PKCE redirect and exchanges one callback', async () => {
  const f = fixture();
  await expect(f.auth.startGoogle()).resolves.toBe('signed-in');
  expect(f.client.auth.signInWithOAuth).toHaveBeenCalledWith({
    provider: 'google',
    options: { redirectTo: GOOGLE_CALLBACK, skipBrowserRedirect: true },
  });
  expect(f.browser.openAuth).toHaveBeenCalledWith(
    expect.stringContaining('https://fixture.supabase.co/auth/v1/authorize'),
    GOOGLE_CALLBACK,
    { ephemeralWebSession: false, showTitle: true },
  );
  await f.auth.complete(GOOGLE_CALLBACK + '?code=fixture');
  expect(f.client.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  expect(f.openURL).not.toHaveBeenCalled();
});
test('cold and warm duplicate callbacks share their single in-flight exchange', async () => {
  const f = fixture();
  let finish!: () => void;
  f.client.auth.exchangeCodeForSession.mockImplementation(
    () =>
      new Promise(resolve => {
        finish = () => resolve({ error: null });
      }),
  );
  const a = f.auth.complete(GOOGLE_CALLBACK + '?code=fixture'),
    b = f.auth.complete(GOOGLE_CALLBACK + '?code=fixture');
  expect(a).toBe(b);
  finish();
  await expect(a).resolves.toBe(true);
  expect(f.client.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
});
test.each(['cancel', 'dismiss'])(
  'system browser %s does not create a session or exchange a code',
  async type => {
    const f = fixture();
    f.browser.openAuth.mockResolvedValue({ type });
    await expect(f.auth.startGoogle()).resolves.toBe('canceled');
    expect(f.client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  },
);
test('browser fallback uses the system browser and waits for the OS callback', async () => {
  const f = fixture();
  f.browser.isAvailable.mockResolvedValue(false);
  await expect(f.auth.startGoogle()).resolves.toBe('external');
  expect(f.openURL).toHaveBeenCalledTimes(1);
  expect(f.client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  await f.auth.complete(GOOGLE_CALLBACK + '?code=fixture');
  expect(f.client.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
});
test('unrelated callback origins and paths never exchange a code', async () => {
  const f = fixture();
  for (const url of [
    'https://evil.invalid/auth/callback?code=x',
    'offtasks://other/callback?code=x',
    'offtasks://auth/callback/extra?code=x',
    'offtasks://auth/callback#access_token=never',
  ])
    await expect(f.auth.complete(url)).resolves.toBe(false);
  expect(f.client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
});
test('provider errors and expired callbacks remain failures without exposing provider messages', async () => {
  const f = fixture();
  await expect(
    f.auth.complete(
      GOOGLE_CALLBACK + '?error=access_denied&error_description=never',
    ),
  ).rejects.toThrow('canceled');
  expect(f.client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  f.client.auth.exchangeCodeForSession.mockResolvedValue({
    error: { status: 400, message: 'never' },
  });
  await expect(
    f.auth.complete(GOOGLE_CALLBACK + '?code=expired'),
  ).rejects.toThrow('Unable to complete');
});
test('the browser never opens an unexpected authorize destination', async () => {
  const f = fixture();
  f.client.auth.signInWithOAuth.mockResolvedValue({
    data: { url: 'https://evil.invalid/auth/v1/authorize?provider=google' },
    error: null,
  });
  await expect(f.auth.startGoogle()).rejects.toThrow('Unable to start');
  expect(f.browser.openAuth).not.toHaveBeenCalled();
});
test('a Google browser session cannot accept a recovery or foreign callback', async () => {
  for (const url of [
    'offtasks://auth/recovery?code=fixture',
    'https://evil.invalid/callback?code=fixture',
  ]) {
    const f = fixture();
    f.browser.openAuth.mockResolvedValue({ type: 'success', url });
    await expect(f.auth.startGoogle()).rejects.toThrow(
      'Sign-in could not be completed',
    );
    expect(f.client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  }
});
