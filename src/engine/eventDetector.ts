import { DriveEventType } from "../types";
import { THRESHOLDS } from "./thresholds";

/**
 * Detects a harsh braking event based on deceleration along the Y axis.
 * Harsh braking is identified when the negative acceleration (deceleration) along the longitudinal Y axis
 * falls below (is more negative than) the configured threshold.
 *
 * @param y - Accelerometer or device motion Y-axis acceleration (in g-force).
 * @returns 'HARSH_BRAKE' if detected, otherwise null.
 */
export function detectHarshBrake(y: number): DriveEventType | null {
  if (y <= THRESHOLDS.HARSH_BRAKE) {
    return "HARSH_BRAKE";
  }
  return null;
}

/**
 * Detects a harsh acceleration event based on acceleration along the Y axis.
 * Harsh acceleration is identified when the positive acceleration along the longitudinal Y axis
 * exceeds the configured threshold.
 *
 * @param y - Accelerometer or device motion Y-axis acceleration (in g-force).
 * @returns 'HARSH_ACCEL' if detected, otherwise null.
 */
export function detectHarshAcceleration(y: number): DriveEventType | null {
  if (y >= THRESHOLDS.HARSH_ACCEL) {
    return "HARSH_ACCEL";
  }
  return null;
}

/**
 * Detects a sharp turn event based on rotation rate around the Z axis.
 * A sharp turn is identified when the angular velocity around the vertical Z axis (yaw rate)
 * exceeds the configured threshold.
 *
 * @param z - Gyroscope Z-axis angular velocity (in rad/s).
 * @returns 'SHARP_TURN' if detected, otherwise null.
 */
export function detectSharpTurn(z: number): DriveEventType | null {
  if (Math.abs(z) >= THRESHOLDS.SHARP_TURN) {
    return "SHARP_TURN";
  }
  return null;
}

/**
 * Detects an aggressive steering event based on high rotation rates around X or Z axes.
 * Aggressive steering is identified when the rotation rate around the Z (yaw) or X (pitch) axes
 * exceeds the higher aggressive steering threshold.
 *
 * @param x - Gyroscope X-axis angular velocity (in rad/s).
 * @param z - Gyroscope Z-axis angular velocity (in rad/s).
 * @returns 'AGGRESSIVE_STEER' if detected, otherwise null.
 */
export function detectAggressiveSteering(x: number, z: number): DriveEventType | null {
  if (Math.abs(x) >= THRESHOLDS.AGGRESSIVE_STEER || Math.abs(z) >= THRESHOLDS.AGGRESSIVE_STEER) {
    return "AGGRESSIVE_STEER";
  }
  return null;
}

/**
 * Detects possible phone handling based on a spike in accelerometer magnitude.
 * Phone handling is identified when the total magnitude of forces measured by the accelerometer
 * exceeds the configured threshold, indicating sudden movements characteristic of manual handling.
 *
 * @param x - Accelerometer X-axis measurement.
 * @param y - Accelerometer Y-axis measurement.
 * @param z - Accelerometer Z-axis measurement.
 * @returns 'PHONE_HANDLING' if detected, otherwise null.
 */
export function detectPhoneHandling(x: number, y: number, z: number): DriveEventType | null {
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  if (magnitude >= THRESHOLDS.PHONE_HANDLING) {
    return "PHONE_HANDLING";
  }
  return null;
}

/**
 * Detects excessive device movement/vibration based on device motion acceleration magnitude.
 * Excessive movement is identified when the total acceleration magnitude (excluding gravity)
 * exceeds the configured threshold, suggesting an unstable mount or high vibration environment.
 *
 * @param x - Device motion X-axis acceleration.
 * @param y - Device motion Y-axis acceleration.
 * @param z - Device motion Z-axis acceleration.
 * @returns 'EXCESSIVE_MOVEMENT' if detected, otherwise null.
 */
export function detectExcessiveMovement(x: number, y: number, z: number): DriveEventType | null {
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  if (magnitude >= THRESHOLDS.EXCESSIVE_MOVEMENT) {
    return "EXCESSIVE_MOVEMENT";
  }
  return null;
}
