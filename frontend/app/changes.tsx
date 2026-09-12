import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowsClockwise,
  CalendarX,
  CheckCircle,
  MapPinLine,
  Plus,
} from "phosphor-react-native";

import { useMarkChangesRead, useScheduleChanges } from "@/src/api/hooks";
import { ModalHeader } from "@/src/components/modal-header";
import { EmptyState, LoadingView } from "@/src/components/ui";
import { parseRome } from "@/src/lib/time";
import type { ScheduleChange } from "@/src/models";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { padding: spacing.md, gap: spacing.sm },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  body: { flex: 1 },
  message: { fontSize: 14, color: c.onSurface, lineHeight: 20 },
  date: { fontSize: 12, color: c.muted, marginTop: 4 },
}));

const META: Record<
  ScheduleChange["type"],
  { icon: (color: string) => React.ReactNode; tint: keyof ReturnType<typeof useTheme>["colors"] }
> = {
  room_change: { icon: (c) => <MapPinLine size={20} color={c} weight="bold" />, tint: "warning" },
  time_change: { icon: (c) => <ArrowsClockwise size={20} color={c} weight="bold" />, tint: "warning" },
  cancelled: { icon: (c) => <CalendarX size={20} color={c} weight="bold" />, tint: "error" },
  new: { icon: (c) => <Plus size={20} color={c} weight="bold" />, tint: "success" },
};

export default function Changes() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const changes = useScheduleChanges();
  const markRead = useMarkChangesRead();

  useEffect(() => {
    if ((changes.data ?? []).some((c) => !c.read)) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changes.data]);

  return (
    <View style={s.root}>
      <ModalHeader title="Modifiche orario" onClose={() => router.back()} />
      {changes.isLoading ? (
        <LoadingView />
      ) : (changes.data ?? []).length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={40} color={colors.borderStrong} />}
          title="Nessuna modifica"
          subtitle="Quando UniBo cambia un'aula, un orario o una lezione, lo vedrai qui."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {(changes.data ?? []).map((ch) => {
            const meta = META[ch.type];
            const tint = colors[meta.tint] as string;
            return (
              <View key={ch.id} style={s.card} testID={`change-${ch.id}`}>
                <View style={[s.iconWrap, { backgroundColor: `${tint}22` }]}>{meta.icon(tint)}</View>
                <View style={s.body}>
                  <Text style={s.message}>{ch.message}</Text>
                  <Text style={s.date}>
                    Rilevato il {parseRome(ch.detected_at).format("D MMM [alle] HH:mm")}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
