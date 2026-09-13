import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
export function verifyAnalytics(root) {
  const config = JSON.parse(fs.readFileSync(path.join(root,'src/analytics/production.json'),'utf8'));
  assert.equal(config.apiBaseUrl,'https://api.etlyn.com','Analytics must use the Etlyn production collector');
  for(const platform of ['ios','android']) assert.match(config.keys[platform],/^[A-Za-z0-9_-]{16,128}$/,'Missing native analytics registration');
  assert.notEqual(config.keys.ios,config.keys.android,'Each platform needs its own registration');
  const archive='vendor/etlyn-analytics-0.5.0-alpha.0.tgz';
  const digest=createHash('sha1').update(fs.readFileSync(path.join(root,archive))).digest('hex');
  assert.ok(fs.readFileSync(path.join(root,'yarn.lock'),'utf8').includes(`file:${archive}#${digest}`),'Analytics archive does not match yarn.lock');
}
