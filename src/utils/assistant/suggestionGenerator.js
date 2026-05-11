/**
 * Generates follow-up question suggestions based on the assistant's reply.
 * Uses simple keyword matching — no AI required.
 */

const KEYWORD_SUGGESTIONS = [
  {
    keywords: ['children', 'child', 'kids'],
    question: 'How many children need attention?',
  },
  {
    keywords: ['plan', 'plans'],
    question: 'Show plan details',
  },
  {
    keywords: ['metric', 'metrics', 'statistics', 'stats'],
    question: 'Explain these metrics',
  },
  {
    keywords: ['staff', 'specialist', 'specialists'],
    question: 'Show staff details',
  },
  {
    keywords: ['family', 'families', 'enrollment'],
    question: 'Show family enrollment details',
  },
  {
    keywords: ['review', 'reviews', 'pending'],
    question: 'What are the pending reviews?',
  },
];

const ERROR_PHRASES = ['unavailable', 'error', 'failed', 'cannot', "can't", 'sorry'];

/**
 * Returns an array of 0-3 follow-up question strings based on the reply content.
 *
 * @param {string} reply - The assistant's reply text
 * @returns {string[]}
 */
export function generateSuggestions(reply) {
  if (!reply || typeof reply !== 'string') return [];

  // Skip short replies
  if (reply.trim().length < 50) return [];

  const lower = reply.toLowerCase();

  // Skip error messages
  if (ERROR_PHRASES.some((phrase) => lower.includes(phrase))) return [];

  const suggestions = [];

  for (const { keywords, question } of KEYWORD_SUGGESTIONS) {
    if (suggestions.length >= 3) break;
    if (keywords.some((kw) => lower.includes(kw))) {
      suggestions.push(question);
    }
  }

  return suggestions;
}
