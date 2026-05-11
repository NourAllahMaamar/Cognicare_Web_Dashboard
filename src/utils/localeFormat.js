const ARABIC_NUMBER_STORAGE_KEY = 'cognicare-arabic-number-style';

export function getArabicNumberStyle() {
  if (typeof localStorage === 'undefined') return 'western';
  return localStorage.getItem(ARABIC_NUMBER_STORAGE_KEY) === 'arabic'
    ? 'arabic'
    : 'western';
}

export function setArabicNumberStyle(style) {
  if (typeof localStorage === 'undefined') return;
  const normalized = style === 'arabic' ? 'arabic' : 'western';
  localStorage.setItem(ARABIC_NUMBER_STORAGE_KEY, normalized);
  window.dispatchEvent(
    new CustomEvent('cognicare:number-style-change', {
      detail: { style: normalized },
    }),
  );
}

export function localeForNumbers(language) {
  const base = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
  if (language !== 'ar') return base;
  return getArabicNumberStyle() === 'arabic'
    ? 'ar-TN-u-nu-arab'
    : 'ar-TN-u-nu-latn';
}

export function formatDate(value, language, options) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(localeForNumbers(language), options);
}

export function formatDateTime(value, language, options) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(localeForNumbers(language), options);
}

export function formatNumber(value, language, options) {
  return Number(value || 0).toLocaleString(localeForNumbers(language), options);
}
