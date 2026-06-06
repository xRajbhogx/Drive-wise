import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>

      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ActiveDriveScreen">
        <NativeTabs.Trigger.Label>Active Drive</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="play.circle.fill" md="play_circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="EventList">
        <NativeTabs.Trigger.Label>Events</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="SessionSummary">
        <NativeTabs.Trigger.Label>Session Summary</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="assessment" />
      </NativeTabs.Trigger>

    </NativeTabs>
  );
}
