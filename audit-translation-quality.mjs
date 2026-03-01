import en from './src/locales/en.json' assert { type: 'json' };
import ar from './src/locales/ar.json' assert { type: 'json' };
import fr from './src/locales/fr.json' assert { type: 'json' };

function flattenObj(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObj(obj[key], fullKey));
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}

const enFlat = flattenObj(en);
const arFlat = flattenObj(ar);
const frFlat = flattenObj(fr);

console.log('=== TRANSLATION QUALITY AUDIT ===\n');

// Check 1: Empty or placeholder translations
console.log('📋 CHECK 1: Empty or Suspicious Translations');
console.log('============================================\n');

let issues = [];

for (const [key, value] of Object.entries(enFlat)) {
  const arVal = arFlat[key];
  const frVal = frFlat[key];

  // Check for empty values
  if (!arVal || arVal.trim() === '') {
    issues.push({ type: 'EMPTY', lang: 'AR', key, value });
  }
  if (!frVal || frVal.trim() === '') {
    issues.push({ type: 'EMPTY', lang: 'FR', key, value });
  }

  // Check for untranslated keys (key appears in value)
  if (arVal && arVal.includes('{{') && arVal.includes('}}')) {
    // Skip interpolation keys
  } else if (arVal && arVal.toLowerCase() === value.toLowerCase()) {
    issues.push({ type: 'LIKELY_UNTRANSLATED', lang: 'AR', key, value: arVal });
  }

  if (frVal && frVal.toLowerCase() === value.toLowerCase()) {
    issues.push({ type: 'LIKELY_UNTRANSLATED', lang: 'FR', key, value: frVal });
  }

  // Check for placeholder text
  if (arVal && (arVal.includes('...') || arVal === value)) {
    // Might be OK, but flag for review
  }
}

if (issues.length === 0) {
  console.log('✅ No empty or suspicious translations found!\n');
} else {
  console.log(`⚠️  Found ${issues.length} potential issues:\n`);
  issues.forEach(issue => {
    console.log(`  ${issue.type} | ${issue.lang} | ${issue.key}`);
    console.log(`    EN: "${issue.value}"`);
    console.log(`    Found: "${arFlat[issue.key] || frFlat[issue.key]}"\n`);
  });
}

// Check 2: Consistency Check - Same English word should be translated consistently
console.log('\n📋 CHECK 2: Translation Consistency');
console.log('====================================\n');

const commonWords = ['volunteer', 'specialist', 'caregiver', 'family', 'child', 'staff', 'organization'];
const consistency = {};

for (const word of commonWords) {
  consistency[word] = {
    ar: new Set(),
    fr: new Set()
  };
  
  for (const [key, value] of Object.entries(enFlat)) {
    if (value.toLowerCase().includes(word)) {
      const arVal = arFlat[key];
      const frVal = frFlat[key];
      if (arVal) consistency[word].ar.add(arVal);
      if (frVal) consistency[word].fr.add(frVal);
    }
  }
}

let consistencyIssues = 0;
for (const [word, translations] of Object.entries(consistency)) {
  if (translations.ar.size > 1 || translations.fr.size > 1) {
    console.log(`⚠️  "${word}" has ${translations.ar.size} Arabic translations:`);
    [...translations.ar].forEach(t => console.log(`    - ${t}`));
    console.log(`   and ${translations.fr.size} French translations:`);
    [...translations.fr].forEach(t => console.log(`    - ${t}`));
    console.log();
    consistencyIssues++;
  }
}

if (consistencyIssues === 0) {
  console.log('✅ All key terms are translated consistently!\n');
}

// Check 3: Key length comparison (unusual if too different)
console.log('\n📋 CHECK 3: Translation Length Analysis');
console.log('=========================================\n');

let lengthIssues = [];
for (const [key, enVal] of Object.entries(enFlat)) {
  const arVal = arFlat[key] || '';
  const frVal = frFlat[key] || '';
  
  const enLen = enVal.length;
  const arLen = arVal.length;
  const frLen = frVal.length;
  
  // Flag if translation is more than 3x or less than 0.3x the English length
  if (arLen > enLen * 3 || (arLen > 0 && arLen < enLen * 0.3)) {
    lengthIssues.push({ key, lang: 'AR', en: enLen, trans: arLen });
  }
  if (frLen > enLen * 3 || (frLen > 0 && frLen < enLen * 0.3)) {
    lengthIssues.push({ key, lang: 'FR', en: enLen, trans: frLen });
  }
}

if (lengthIssues.length === 0) {
  console.log('✅ All translations have reasonable lengths!\n');
} else {
  console.log(`⚠️  Found ${lengthIssues.length} translations with unusual lengths:\n`);
  lengthIssues.slice(0, 10).forEach(issue => {
    console.log(`  ${issue.key}`);
    console.log(`    ${issue.lang}: EN=${issue.en}chars, TRANS=${issue.trans}chars (ratio: ${(issue.trans/issue.en).toFixed(2)}x)\n`);
  });
  if (lengthIssues.length > 10) {
    console.log(`  ... and ${lengthIssues.length - 10} more\n`);
  }
}

// Check 4: Special character balance
console.log('\n📋 CHECK 4: Special Characters & Formatting');
console.log('==============================================\n');

let formatIssues = [];
for (const [key, enVal] of Object.entries(enFlat)) {
  const arVal = arFlat[key] || '';
  const frVal = frFlat[key] || '';
  
  // Check for unbalanced brackets
  const enBrackets = (enVal.match(/\{\{/g) || []).length;
  const arBrackets = (arVal.match(/\{\{/g) || []).length;
  const frBrackets = (frVal.match(/\{\{/g) || []).length;
  
  if (enBrackets !== arBrackets) {
    formatIssues.push({ key, lang: 'AR', issue: `Mismatched interpolation: EN=${enBrackets}, AR=${arBrackets}` });
  }
  if (enBrackets !== frBrackets) {
    formatIssues.push({ key, lang: 'FR', issue: `Mismatched interpolation: EN=${enBrackets}, FR=${frBrackets}` });
  }
}

if (formatIssues.length === 0) {
  console.log('✅ All special formatting is balanced!\n');
} else {
  console.log(`⚠️  Found ${formatIssues.length} formatting issues:\n`);
  formatIssues.forEach(issue => {
    console.log(`  ${issue.lang} | ${issue.key}`);
    console.log(`    ${issue.issue}\n`);
  });
}

// Summary
console.log('\n📊 SUMMARY');
console.log('===========');
console.log(`Total keys: ${Object.keys(enFlat).length}`);
console.log(`English completeness: 100%`);
console.log(`Arabic completeness: ${((Object.keys(arFlat).length / Object.keys(enFlat).length) * 100).toFixed(1)}%`);
console.log(`French completeness: ${((Object.keys(frFlat).length / Object.keys(enFlat).length) * 100).toFixed(1)}%`);
console.log(`\nTotal issues found: ${issues.length + lengthIssues.length + formatIssues.length}`);
