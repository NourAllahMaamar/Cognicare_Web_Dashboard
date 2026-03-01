const en = require('./src/locales/en.json');
const ar = require('./src/locales/ar.json');
const fr = require('./src/locales/fr.json');

function getKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = new Set(getKeys(en));
const arKeys = new Set(getKeys(ar));
const frKeys = new Set(getKeys(fr));

console.log('=== KEY COUNT ===');
console.log('English:', enKeys.size);
console.log('Arabic:', arKeys.size);
console.log('French:', frKeys.size);

console.log('\n=== MISSING IN ARABIC ===');
const missingAr = [...enKeys].filter(k => !arKeys.has(k));
console.log(`Count: ${missingAr.length}`);
missingAr.forEach(k => console.log(k));

console.log('\n=== MISSING IN FRENCH ===');
const missingFr = [...enKeys].filter(k => !frKeys.has(k));
console.log(`Count: ${missingFr.length}`);
missingFr.forEach(k => console.log(k));

console.log('\n=== EXTRA IN ARABIC (not in EN) ===');
const extraAr = [...arKeys].filter(k => !enKeys.has(k));
console.log(`Count: ${extraAr.length}`);
extraAr.forEach(k => console.log(k));

console.log('\n=== EXTRA IN FRENCH (not in EN) ===');
const extraFr = [...frKeys].filter(k => !enKeys.has(k));
console.log(`Count: ${extraFr.length}`);
extraFr.forEach(k => console.log(k));
