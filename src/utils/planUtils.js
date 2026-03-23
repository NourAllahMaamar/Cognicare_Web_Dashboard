/**
 * Shared utilities for specialist plan components.
 * Centralises colour helpers and date formatting that were duplicated across
 * SpecialistOverview, SpecialistChildren, and SpecialistPlans.
 */

/** Tailwind dot-colour class for a plan type badge. */
export const getTypeColor = (type) => {
  switch (type) {
    case 'PECS':         return 'bg-blue-500';
    case 'TEACCH':       return 'bg-purple-500';
    case 'SkillTracker': return 'bg-success';
    case 'Activity':     return 'bg-amber-500';
    default:             return 'bg-slate-500';
  }
};

/** Tailwind background tint class for a plan type card. */
export const getTypeBg = (type) => {
  switch (type) {
    case 'PECS':         return 'bg-blue-500/5';
    case 'TEACCH':       return 'bg-purple-500/5';
    case 'SkillTracker': return 'bg-success/5';
    case 'Activity':     return 'bg-amber-500/5';
    default:             return 'bg-slate-500/5';
  }
};

/**
 * Locale-aware date formatter.
 * @param {string|Date|null} d - date value
 * @param {string} lang - i18n language code (e.g. 'ar', 'fr', 'en')
 * @returns {string}
 */
export const dateFmt = (d, lang = 'en') => {
  if (!d) return '—';
  const locale = lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(d).toLocaleDateString(locale);
};
