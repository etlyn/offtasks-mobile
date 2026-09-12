import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  PRODUCTION_SUPABASE_URL,
  readProductionEnv,
  validateProductionConfig,
  verifyProduction,
} from './verify-production.mjs';

const keyFor = claims =>
  `header.${Buffer.from(JSON.stringify(claims)).toString(
    'base64url',
  )}.signature`;
const productionRef = new URL(PRODUCTION_SUPABASE_URL).hostname.split('.')[0];
const config = {
  SUPABASE_URL: PRODUCTION_SUPABASE_URL,
  SUPABASE_ANON_KEY: keyFor({
    role: 'anon',
    ref: productionRef,
    exp: 4102444800,
  }),
};

test('accepts a matching public project configuration', () => {
  assert.equal(
    validateProductionConfig(config).url.origin,
    config.SUPABASE_URL,
  );
});

test('reads the same production overlays as the bundle and prefers process values', context => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'offtasks-production-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const names = [
    '.env',
    '.env.production',
    '.env.local',
    '.env.production.local',
  ];
  for (const name of names) {
    fs.writeFileSync(
      path.join(root, name),
      `SUPABASE_URL=https://${name.slice(1)}.example.com\n`,
    );
    assert.equal(
      readProductionEnv(root, {}).SUPABASE_URL,
      `https://${name.slice(1)}.example.com`,
    );
  }
  assert.deepEqual(readProductionEnv(root, config), config);
});

test('rejects environment modes that would select a different bundle configuration', context => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'offtasks-production-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(readProductionEnv(root, {}), {});
  for (const name of ['APP_ENV', 'BABEL_ENV']) {
    assert.throws(
      () => readProductionEnv(root, { [name]: 'staging' }),
      /production/,
    );
    assert.equal(
      readProductionEnv(root, { [name]: 'production' })[name],
      'production',
    );
  }
});

test('rejects local origins, private keys, mismatched projects and expired keys', () => {
  for (const url of [
    'http://localhost:54321',
    PRODUCTION_SUPABASE_URL.replace('https:', 'http:'),
    'https://example.com',
    PRODUCTION_SUPABASE_URL.replace('https://', 'https://user:secret@'),
  ]) {
    assert.throws(() =>
      validateProductionConfig({ ...config, SUPABASE_URL: url }),
    );
  }
  assert.throws(() =>
    validateProductionConfig({
      SUPABASE_URL: 'https://other.supabase.co',
      SUPABASE_ANON_KEY: keyFor({
        role: 'anon',
        ref: 'other',
        exp: 4102444800,
      }),
    }),
  );
  for (const claims of [
    { role: 'service_role', ref: productionRef, exp: 4102444800 },
    { role: 'anon', ref: 'other', exp: 4102444800 },
    { role: 'anon', ref: productionRef, exp: 1 },
  ]) {
    assert.throws(() =>
      validateProductionConfig({
        ...config,
        SUPABASE_ANON_KEY: keyFor(claims),
      }),
    );
  }
});

test('checks production auth without submitting user credentials', async () => {
  await verifyProduction(config, async (url, options) => {
    assert.equal(url.pathname, '/auth/v1/health');
    assert.equal(options.headers.apikey, config.SUPABASE_ANON_KEY);
    assert.equal(options.body, undefined);
    return { ok: true };
  });
  await assert.rejects(
    verifyProduction(config, async () => {
      throw new Error('ENOTFOUND');
    }),
    /unreachable/,
  );
  await assert.rejects(
    verifyProduction(config, async () => ({ ok: false, status: 401 })),
    /HTTP 401/,
  );
});
