import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkle } from "phosphor-react-native";

import {
  useCreateStudySession,
  useLessons,
  usePersonalEvents,
  useStudySessions,
  useSubjects,
} from "@/src/api/hooks";
import { PickerField } from "@/src/components/date-picker-field";
import { Dot, EmptyState, PrimaryButton } from "@/src/components/ui";
import { ModalHeader } from "@/src/components/modal-header";
import { minutesToLabel, parseRome, todayYmd } from "@/src/lib/time";
import { computeFreeSlots, suggestStudyBlocks } from "@/src/planner/freeTime";
import { makeStyles, radius, spacing, subjectColor, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { padding: spacing.md, gap: spacing.md },
  intro: { fontSize: 14, color: c.muted, lineHeight: 20, marginBottom: spacing.xs },
  card: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    gap: spacing.sm,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  subject: { fontSize: 16, fontWeight: "700", color: c.onSurface, flex: 1 },
  time: { fontSize: 14, color: c.onSurfaceSecondary },
  editRow: { flexDirection: "row", gap: spacing.sm },
  editCol: { flex: 1, gap: 4 },
  editLabel: { fontSize: 12, color: c.muted, fontWeight: "600" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  action: { flex: 1, paddingVertical: 11, borderRadius: radius.md, alignItems: "center" },
  accept: { backgroundColor: c.brandPrimary },
  acceptText: { color: c.onBrandPrimary, fontWeight: "600" },
  ghost: { backgroundColor: c.surfaceTertiary },
  ghostText: { color: c.onSurfaceTertiary, fontWeight: "600" },
}));

interface Item {
  id: string;
  subject_key: string | null;
  subject_name: string;
  color_token: string;
  start: Date;
  end: Date;
  editing: boolean;
}

export default function Planner() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = todayYmd();

  const lessons = useLessons(today, today);
  const study = useStudySessions(today, today);
  const personal = usePersonalEvents(today, today);
  const subjects = useSubjects();
  const createSession = useCreateStudySession();

  const initial = useMemo<Item[]>(() => {
    const busy = [
      ...(lessons.data ?? []).map((l) => ({ start: l.start, end: l.end })),
      ...(study.data ?? []).map((x) => ({ start: x.start, end: x.end })),
      ...(personal.data ?? []).map((p) => ({ start: p.start, end: p.end })),
    ];
    const free = computeFreeSlots(today, busy, { minMinutes: 45, fromNow: true });
    return suggestStudyBlocks(free, subjects.data ?? []).map((x) => ({
      id: x.id,
      subject_key: x.subject_key,
      subject_name: x.subject_name,
      color_token: x.color_token,
      start: new Date(x.start),
      end: new Date(x.end),
      editing: false,
    }));
  }, [lessons.data, study.data, personal.data, subjects.data, today]);

  const [items, setItems] = useState<Item[] | null>(null);
  const list = items ?? initial;

  const update = (id: string, patch: Partial<Item>) =>
    setItems(list.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const remove = (id: string) => setItems(list.filter((it) => it.id !== id));

  const accept = (item: Item) => {
    const minutes = Math.max(15, Math.round((item.end.getTime() - item.start.getTime()) / 60000));
    createSession.mutate(
      {
        subject_key: item.subject_key,
        date: today,
        start: dayjs(item.start).format("YYYY-MM-DDTHH:mm:ss"),
        end: dayjs(item.end).format("YYYY-MM-DDTHH:mm:ss"),
        planned_minutes: minutes,
        source: "planner",
      },
      { onSuccess: () => remove(item.id) },
    );
  };

  return (
    <View style={s.root}>
      <ModalHeader title="Pianifica studio" onClose={() => router.back()} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {list.length ? (
          <>
            <Text style={s.intro}>
              In base alle tue finestre libere di oggi, ecco alcuni blocchi di studio suggeriti.
              Puoi accettarli, modificarli o ignorarli.
            </Text>
            {list.map((item) => (
              <View key={item.id} style={s.card}>
                <View style={s.head}>
                  <Dot color={subjectColor(item.color_token, colors)} />
                  <Text style={s.subject}>{item.subject_name}</Text>
                  <Sparkle size={16} color={colors.warning} weight="fill" />
                </View>
                {item.editing ? (
                  <View style={s.editRow}>
                    <View style={s.editCol}>
                      <Text style={s.editLabel}>Inizio</Text>
                      <PickerField mode="time" value={item.start} onChange={(d) => update(item.id, { start: d })} testID={`planner-start-${item.id}`} />
                    </View>
                    <View style={s.editCol}>
                      <Text style={s.editLabel}>Fine</Text>
                      <PickerField mode="time" value={item.end} onChange={(d) => update(item.id, { end: d })} testID={`planner-end-${item.id}`} />
                    </View>
                  </View>
                ) : (
                  <Text style={s.time}>
                    {dayjs(item.start).format("HH:mm")} – {dayjs(item.end).format("HH:mm")} ·{" "}
                    {minutesToLabel(Math.round((item.end.getTime() - item.start.getTime()) / 60000))}
                  </Text>
                )}
                <View style={s.actions}>
                  <Pressable style={[s.action, s.accept]} onPress={() => accept(item)} testID={`planner-accept-${item.id}`}>
                    <Text style={s.acceptText}>Accetta</Text>
                  </Pressable>
                  <Pressable
                    style={[s.action, s.ghost]}
                    onPress={() => update(item.id, { editing: !item.editing })}
                    testID={`planner-edit-${item.id}`}
                  >
                    <Text style={s.ghostText}>{item.editing ? "Fatto" : "Modifica"}</Text>
                  </Pressable>
                  <Pressable style={[s.action, s.ghost]} onPress={() => remove(item.id)} testID={`planner-ignore-${item.id}`}>
                    <Text style={s.ghostText}>Ignora</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        ) : (
          <EmptyState
            title="Nessun blocco da suggerire"
            subtitle="Non ci sono finestre libere sufficienti oggi, oppure hai già pianificato tutto."
          />
        )}
      </ScrollView>
    </View>
  );
}
