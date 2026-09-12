import { Redirect } from "expo-router";
import { View } from "react-native";

import { useProfile } from "@/src/api/hooks";
import { LoadingView } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export default function Index() {
  const { colors } = useTheme();
  const { data, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <LoadingView />
      </View>
    );
  }

  if (isError || !data || !data.onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
