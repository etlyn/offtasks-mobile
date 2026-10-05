/* eslint-env node */
// Keep the actual Lucide components while avoiding its eager all-icons barrel in Jest.
const fs = require('node:fs');
const path = require('node:path');

const directory = path.join(__dirname, '../../node_modules/lucide-react-native/dist/cjs');
const source = fs.readFileSync(path.join(directory, 'lucide-react-native.js'), 'utf8');
const imports = new Map();
for (const match of source.matchAll(/^var (\w+) = require\('([^']+)'\);$/gm)) {
  imports.set(match[1], match[2]);
}

Object.defineProperty(exports, '__esModule', {value: true});
let count = 0;
for (const match of source.matchAll(/^exports\.(\w+) = (\w+)(?:\.(\w+))?;$/gm)) {
  const [, name, binding, property] = match;
  const location = imports.get(binding);
  if (!location) throw new Error(`Unsupported Lucide export: ${name}`);
  Object.defineProperty(exports, name, {
    enumerable: true,
    get() {
      const actual = require(path.join(directory, location));
      return property ? actual[property] : actual;
    },
  });
  count += 1;
}
if (count === 0) throw new Error('Lucide CJS exports could not be loaded');
