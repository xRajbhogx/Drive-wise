/**
 * Types of unsafe driving events detected by the app's sensors.
 */
export type DriveEventType =
  | 'HARSH_BRAKE'
  | 'HARSH_ACCEL'
  | 'SHARP_TURN'
  | 'AGGRESSIVE_STEER'
  | 'PHONE_HANDLING'
  | 'EXCESSIVE_MOVEMENT';

/**
 * A recorded driving event during a session.
 */
export interface DriveEvent {
  /** Unique identifier for the event instance. */
  id: string;
  /** The type of unsafe behavior detected. */
  type: DriveEventType;
  /** Epoch timestamp in milliseconds when the event was detected. */
  timestamp: number;
  /** The sensor magnitude/value that triggered the event. */
  value: number;
}

/**
 * Safety rating labels based on the final driving score.
 */
export type SafetyRating = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';

/**
 * Summary statistics computed at the end of a driving session.
 */
export interface SessionSummary {
  /** Duration of the drive in seconds. */
  durationSeconds: number;
  /** Total number of safety events detected. */
  totalEvents: number;
  /** Counts of each type of event detected. */
  eventBreakdown: Record<DriveEventType, number>;
  /** Final score from 100 downward. */
  score: number;
  /** Qualitative safety rating based on the final score. */
  safetyRating: SafetyRating;
}
