import { Linking } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { supabaseClient, supabaseOrigin } from './supabase';
import { createNativeAuth } from './nativeAuth';

const auth = createNativeAuth({
  client: supabaseClient,
  origin: supabaseOrigin,
  browser: InAppBrowser,
  openURL: url => Linking.openURL(url),
});
export const startGoogleSignIn = auth.startGoogle;
export const completeNativeSignIn = auth.complete;
