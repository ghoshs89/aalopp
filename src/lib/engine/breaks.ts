/** Number of wrong answers in a row, at the end of the session, that prompts a gentle break suggestion. */
export const BREAK_AFTER_WRONG_IN_A_ROW = 3;

/**
 * Suggest a break when the most recent answers are all wrong, at most once per session. The child can always keep going;
 * this is an offer, not a lock, and answer speed is never part of it.
 */
export function shouldSuggestBreak(results: boolean[], alreadySuggested: boolean): boolean {
  if (alreadySuggested || results.length < BREAK_AFTER_WRONG_IN_A_ROW) return false;
  return results.slice(-BREAK_AFTER_WRONG_IN_A_ROW).every((correct) => !correct);
}
