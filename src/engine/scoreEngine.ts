import { DriveEventType, DriveEvent, SafetyRating } from '../types';

/**
 * Penalty points deducted from the initial score of 100 for each detected event type.
 */
export const PENALTIES: Record<DriveEventType, number> = {
  HARSH_BRAKE: 5,
  HARSH_ACCEL: 5,
  SHARP_TURN: 3,
  AGGRESSIVE_STEER: 3,
  PHONE_HANDLING: 10,
  EXCESSIVE_MOVEMENT: 2,
} as const;

/**
 * Calculates the safety score from 100 downward based on the events that occurred.
 * The score starts at 100 and decreases by the penalty value of each event, but is capped at 0.
 *
 * @param events - An array of drive events detected during the session.
 * @returns The final safety score (integer between 0 and 100).
 */
export function calculateScore(events: DriveEvent[]): number {
  let score = 100;
  for (const event of events) {
    const penalty = PENALTIES[event.type] || 0;
    score -= penalty;
  }
  return Math.max(0, score);
}

/**
 * Returns the safety rating text based on the safety score.
 * 
 * Safety ratings:
 * - 90–100: Excellent
 * - 75–89: Good
 * - 60–74: Fair
 * - 40–59: Poor
 * - 0–39: Dangerous
 *
 * @param score - The driving score (0 to 100).
 * @returns The SafetyRating classification.
 */
export function getSafetyRating(score: number): SafetyRating {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Dangerous';
}
