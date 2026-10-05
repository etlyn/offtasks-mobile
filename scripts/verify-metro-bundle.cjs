const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parse} = require('@babel/parser');

// Check the actual bundled RN bootstrap dependency, not a mocked resolver.
const source = fs.readFileSync(process.argv[2], 'utf8');
const modules = new Map();
const sandbox = {__d: (factory, id, dependencies) => modules.set(id, {factory, dependencies})};
const context = vm.createContext(sandbox);
for (const statement of parse(source).program.body) {
  const call = statement.expression;
  if (call && call.type === 'CallExpression' && call.callee.name === '__d') {
    vm.runInContext(source.slice(statement.start, statement.end), context);
  }
}
const performanceBootstrap = [...modules.values()].find(({factory}) =>
  factory.toString().includes('_setUpPerformanceModern'));
assert.ok(performanceBootstrap, 'Actual RN performance bootstrap must be bundled');
const helper = modules.get(performanceBootstrap.dependencies[0]);
assert.ok(helper, 'Bootstrap Babel interop dependency must exist');
const moduleResult = {exports: {}};
helper.factory(sandbox, () => {throw new Error('Unexpected helper dependency');},
  undefined, undefined, moduleResult, moduleResult.exports, helper.dependencies);
assert.equal(typeof moduleResult.exports, 'function',
  'RN bootstrap requires a CommonJS function, not an ES module namespace');
const fn = () => {};
assert.equal(moduleResult.exports({__esModule: true, default: fn}).default, fn);
console.log('Production RN bootstrap Babel-helper contract: PASS');
