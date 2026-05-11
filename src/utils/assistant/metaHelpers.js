/**
 * Shared helper functions for displaying assistant response metadata.
 * Used by AssistantBranding and DashboardAssistant.
 */

/**
 * Returns a human-readable label for the assistant's response strategy.
 * @param {object} meta - AssistantMeta object
 * @param {function} t - i18next translation function
 * @returns {string}
 */
export function metaLabel(meta, t) {
  switch (meta?.strategy) {
    case 'default':
      return t('dashboardAssistant.meta.instantSummary', 'Instant summary');
    case 'cached':
      return t('dashboardAssistant.meta.reusedAnswer', 'Reused answer');
    case 'lite_model':
      return t('dashboardAssistant.meta.lightAnalysis', 'Light analysis');
    case 'smart_model':
      return t('dashboardAssistant.meta.deepAnalysis', 'Deep analysis');
    default:
      return t('dashboardAssistant.meta.assistantReply', 'Assistant reply');
  }
}

/**
 * Returns a human-readable timestamp string for when the assistant response was generated.
 * @param {object} meta - AssistantMeta object
 * @param {function} t - i18next translation function
 * @param {string} locale - BCP 47 locale string (e.g. 'en', 'fr', 'ar')
 * @returns {string}
 */
export function metaTimestamp(meta, t, locale) {
  if (!meta?.generatedAt) {
    return t('dashboardAssistant.meta.justUpdated', 'just updated');
  }

  const parsed = new Date(meta.generatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return t('dashboardAssistant.meta.justUpdated', 'just updated');
  }

  const time = parsed.toLocaleTimeString(locale || undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return t('dashboardAssistant.meta.updatedAt', {
    time,
    defaultValue: 'updated at {{time}}',
  });
}
