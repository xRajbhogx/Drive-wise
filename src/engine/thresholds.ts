/**
 * Threshold configurations for driving behavior event detection.
 * All sensor values are calibrated/normalized (e.g., accelerations in g-force).
 * 
 * Non-Negotiable Rule: All threshold values must live in this file only.
 */
export const THRESHOLDS = {
  /** Harsh braking: acceleration threshold along the Y axis (longitudinal deceleration in g-force). */
  HARSH_BRAKE: -1.5,
  
  /** Harsh acceleration: acceleration threshold along the Y axis (longitudinal acceleration in g-force). */
  HARSH_ACCEL: 1.5,
  
  /** Phone handling: acceleration magnitude spike threshold indicating movement/handling. */
  PHONE_HANDLING: 2.5,
  
  /** Sharp turn: angular velocity threshold around the Z axis (yaw rate in rad/s). */
  SHARP_TURN: 1.2,
  
  /** Aggressive steering: rapid rotation threshold around the Z/X axes (higher angular velocity in rad/s). */
  AGGRESSIVE_STEER: 2.0,
  
  /** Excessive movement: device motion acceleration magnitude threshold indicating high vibration or unstable mount. */
  EXCESSIVE_MOVEMENT: 1.8,
  
  /** Debounce window: time in milliseconds during which repeated occurrences of the same event type are ignored. */
  DEBOUNCE_MS: 1500,
} as const;
