import { useState, useEffect, useRef, useCallback } from "react";
import {
  Accelerometer,
  Gyroscope,
  DeviceMotion,
  AccelerometerMeasurement,
  GyroscopeMeasurement,
  DeviceMotionMeasurement,
} from "expo-sensors";
import { PermissionStatus } from "expo-modules-core";

type Subscription = ReturnType<typeof Accelerometer.addListener>;

export interface UseDrivingSensorsOptions {
  onAccelerometerData?: (data: AccelerometerMeasurement) => void;
  onGyroscopeData?: (data: GyroscopeMeasurement) => void;
  onDeviceMotionData?: (data: DeviceMotionMeasurement) => void;
}

export interface UseDrivingSensorsResult {
  startSensors: () => Promise<boolean>;
  stopSensors: () => void;
  isTracking: boolean;
}

export function useDrivingSensors({
  onAccelerometerData,
  onGyroscopeData,
  onDeviceMotionData,
}: UseDrivingSensorsOptions = {}): UseDrivingSensorsResult {
  const [isTracking, setIsTracking] = useState(false);
  
  // Keep track of active subscriptions to avoid duplicates/memory leaks
  const accelerometerSubscription = useRef<Subscription | null>(null);
  const gyroscopeSubscription = useRef<Subscription | null>(null);
  const deviceMotionSubscription = useRef<Subscription | null>(null);

  // Guard flags to prevent race conditions during starting/stopping
  const isStarting = useRef(false);
  const isTrackingRef = useRef(false);

  // Store callbacks in refs to avoid unsubscribing and resubscribing 
  // whenever callback references change.
  const accelerometerCallbackRef = useRef(onAccelerometerData);
  const gyroscopeCallbackRef = useRef(onGyroscopeData);
  const deviceMotionCallbackRef = useRef(onDeviceMotionData);

  useEffect(() => {
    accelerometerCallbackRef.current = onAccelerometerData;
  }, [onAccelerometerData]);

  useEffect(() => {
    gyroscopeCallbackRef.current = onGyroscopeData;
  }, [onGyroscopeData]);

  useEffect(() => {
    deviceMotionCallbackRef.current = onDeviceMotionData;
  }, [onDeviceMotionData]);

  const stopSensors = useCallback(() => {
    // Remove Accelerometer subscription
    if (accelerometerSubscription.current) {
      accelerometerSubscription.current.remove();
      accelerometerSubscription.current = null;
    }

    // Remove Gyroscope subscription
    if (gyroscopeSubscription.current) {
      gyroscopeSubscription.current.remove();
      gyroscopeSubscription.current = null;
    }

    // Remove DeviceMotion subscription
    if (deviceMotionSubscription.current) {
      deviceMotionSubscription.current.remove();
      deviceMotionSubscription.current = null;
    }

    isTrackingRef.current = false;
    setIsTracking(false);
  }, []);

  const startSensors = useCallback(async (): Promise<boolean> => {
    // Return early if already tracking or currently in the starting process
    if (isTrackingRef.current || isStarting.current) {
      return isTrackingRef.current;
    }

    isStarting.current = true;

    try {
      // 1. Request DeviceMotion permissions if required
      const { status } = await DeviceMotion.getPermissionsAsync();
      let finalStatus = status;

      if (status !== PermissionStatus.GRANTED) {
        const { status: askStatus } = await DeviceMotion.requestPermissionsAsync();
        finalStatus = askStatus;
      }

      if (finalStatus !== PermissionStatus.GRANTED) {
        console.warn("DeviceMotion permission denied. Cannot start tracking driving behavior.");
        isStarting.current = false;
        return false;
      }

      // 2. Set update intervals (in milliseconds)
      Accelerometer.setUpdateInterval(100);
      Gyroscope.setUpdateInterval(100);
      DeviceMotion.setUpdateInterval(200);

      // 3. Register subscriptions if they are not already active
      if (!accelerometerSubscription.current) {
        accelerometerSubscription.current = Accelerometer.addListener((data) => {
          accelerometerCallbackRef.current?.(data);
        });
      }

      if (!gyroscopeSubscription.current) {
        gyroscopeSubscription.current = Gyroscope.addListener((data) => {
          gyroscopeCallbackRef.current?.(data);
        });
      }

      if (!deviceMotionSubscription.current) {
        deviceMotionSubscription.current = DeviceMotion.addListener((data) => {
          deviceMotionCallbackRef.current?.(data);
        });
      }

      isTrackingRef.current = true;
      setIsTracking(true);
      return true;
    } catch (error) {
      console.error("Failed to start driving sensors:", error);
      stopSensors();
      return false;
    } finally {
      isStarting.current = false;
    }
  }, [stopSensors]);

  // Cleanup all subscriptions when the component using the hook unmounts
  useEffect(() => {
    return () => {
      stopSensors();
    };
  }, [stopSensors]);

  return {
    startSensors,
    stopSensors,
    isTracking,
  };
}
