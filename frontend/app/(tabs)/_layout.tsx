import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { BookOpen, CalendarBlank, CheckCircle, Sun } from "phosphor-react-native";

import { useTheme } from "@/src/theme";

const isIOS26 =
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;

export default function TabsLayout() {
  const { colors } = useTheme();

  if (isIOS26) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeTabs, Icon, Label } = require("expo-router/unstable-native-tabs");
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Oggi</Label>
          <Icon sf="sun.max.fill" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="calendar">
          <Label>Calendario</Label>
          <Icon sf="calendar" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="study">
          <Label>Studio</Label>
          <Icon sf="book.fill" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="tasks">
          <Label>Task</Label>
          <Icon sf="checkmark.circle.fill" />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.onSurface,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Oggi",
          tabBarIcon: ({ color, focused }) => (
            <Sun size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendario",
          tabBarIcon: ({ color, focused }) => (
            <CalendarBlank size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: "Studio",
          tabBarIcon: ({ color, focused }) => (
            <BookOpen size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Task",
          tabBarIcon: ({ color, focused }) => (
            <CheckCircle size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
    </Tabs>
  );
}
