/**
 * Generates role- and route-aware quick prompts for the Dashboard Assistant.
 */

/**
 * Returns an array of 3-4 localized quick prompt strings for the given role.
 *
 * @param {string} role - User role: 'admin' | 'orgLeader' | 'specialist' | other
 * @param {string} _route - Current route path (reserved for future route-specific prompts)
 * @param {Function} t - i18next translation function
 * @returns {string[]}
 */
export function getQuickPromptsForContext(role, _route, t) {
  switch (role) {
    case 'admin':
      return [
        t('dashboardAssistant.quick.summarizeMetrics', 'Summarize system metrics'),
        t('dashboardAssistant.quick.pendingReviews', 'Show pending reviews'),
        t('dashboardAssistant.quick.risks', 'What needs attention?'),
        t('dashboardAssistant.quick.userGrowth', 'User growth trend'),
      ];

    case 'orgLeader':
      return [
        t('dashboardAssistant.quick.summarizeOrg', 'Summarize my organization'),
        t('dashboardAssistant.quick.staffOverview', 'Staff overview'),
        t('dashboardAssistant.quick.familyEnrollment', 'Family enrollment status'),
        t('dashboardAssistant.quick.risks', 'What needs attention?'),
      ];

    case 'specialist':
      return [
        t('dashboardAssistant.quick.summarize', 'Summarize this screen'),
        t('dashboardAssistant.quick.risks', 'What needs attention?'),
        t('dashboardAssistant.quick.next', 'What should I check next?'),
        t('dashboardAssistant.quick.childrenPlans', "Show my children's plans"),
      ];

    default:
      return [
        t('dashboardAssistant.quick.summarize', 'Summarize this screen'),
        t('dashboardAssistant.quick.risks', 'What needs attention?'),
        t('dashboardAssistant.quick.next', 'What should I check next?'),
      ];
  }
}
