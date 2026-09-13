import { verifyAnalytics } from './verify-analytics.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

export const PRODUCTION_SUPABASE_URL =
  'https://nqsclqtpnosuhoobgyxc.supabase.co';

export function validateProductionConfig(env) {
  const url = new URL(env.SUPABASE_URL || 'http://invalid');
  assert(
    url.protocol === 'https:' &&
      url.origin === PRODUCTION_SUPABASE_URL &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash,
    'SUPABASE_URL must be the verified Offtasks production Supabase project origin.',
  );
  const key = env.SUPABASE_ANON_KEY || '';
  let claims;
  try {
    claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  } catch {
    throw new Error(
      'SUPABASE_ANON_KEY must be a public anonymous project key.',
    );
  }
  assert(
    claims.role === 'anon' &&
      claims.ref === url.hostname.split('.')[0] &&
      Number.isFinite(claims.exp) &&
      claims.exp > Date.now() / 1000,
    'The anonymous key must match the production project and must not be expired.',
  );
  return { url, key };
}

export async function verifyProduction(env, request = fetch) {
  const { url, key } = validateProductionConfig(env);
  let response;
  try {
    response = await request(new URL('/auth/v1/health', url), {
      headers: { apikey: key },
      redirect: 'error',
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error(
      'Production authentication is unreachable. Check the Supabase project and network before building.',
    );
  }
  assert(
    response.ok,
    `Production authentication health check failed (HTTP ${response.status}).`,
  );
}

export function readProductionEnv(root, environment = process.env) {
  assert(
    !environment.APP_ENV || environment.APP_ENV === 'production',
    'Device builds must use the production environment.',
  );
  assert(
    !environment.BABEL_ENV || environment.BABEL_ENV === 'production',
    'Device builds must use production Babel settings.',
  );
  const config = {};
  for (const name of [
    '.env',
    '.env.production',
    '.env.local',
    '.env.production.local',
  ]) {
    const file = path.join(root, name);
    if (fs.existsSync(file))
      Object.assign(config, parseEnv(fs.readFileSync(file, 'utf8')));
  }
  return { ...config, ...environment };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  Promise.resolve()
    .then(() => verifyAnalytics(root))
    .then(() => verifyProduction(readProductionEnv(root)))
    .then(
      () => console.log('Production Supabase authentication is reachable.'),
      error => {
        console.error(error.message);
        process.exitCode = 1;
      },
    );
}
