import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarBlank, PencilSimple, Plus } from "phosphor-react-native";

import { useSubjects, useTasks, useUpdateTask } from "@/src/api/hooks";
import { TaskRow } from "@/src/components/task-row";
import { Dot, EmptyState, LoadingView, ProgressBar, SectionLabel } from "@/src/components/ui";
import { parseRome } from "@/src/lib/time";
import { makeStyles, radius, spacing, subjectColor, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  title: { fontSize: 28, fontWeight: "700", color: c.onSurface, letterSpacing: -0.5, paddingHorizontal: spacing.md },
  chipsRow: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingTop: spacing.md },
  chip: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipActive: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  chipText: { fontSize: 14, color: c.onSurface, fontWeight: "600" },
  chipTextActive: { color: c.onSurfaceInverse },
  content: { padding: spacing.md, gap: spacing.lg },
  progressCard: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    gap: spacing.md,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subjectName: { fontSize: 18, fontWeight: "700", color: c.onSurface, flex: 1, letterSpacing: -0.3 },
  hoursRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  hoursBig: { fontSize: 24, fontWeight: "700", color: c.onSurface },
  hoursMuted: { fontSize: 15, color: c.muted },
  examRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  examText: { fontSize: 14, color: c.onSurfaceSecondary },
  docente: { fontSize: 13, color: c.muted },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addText: { color: c.info, fontWeight: "600", fontSize: 14 },
}));

export default function StudyScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const subjects = useSubjects();
  const tasks = useTasks();
  const updateTask = useUpdateTask();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedKey && subjects.data?.length) setSelectedKey(subjects.data[0].subject_key);
  }, [subjects.data, selectedKey]);

  const selected = useMemo(
    () => subjects.data?.find((x) => x.subject_key === selectedKey),
    [subjects.data, selectedKey],
  );

  const subjectTasks = useMemo(
    () => (tasks.data ?? []).filter((t) => t.subject_key === selectedKey),
    [tasks.data, selectedKey],
  );

  if (subjects.isLoading) return <LoadingView />;

  if (!subjects.data?.length) {
    return (
      <EmptyState
        icon={<CalendarBlank size={40} color={colors.borderStrong} />}
        title="Nessuna materia attiva"
        subtitle="Sincronizza l'orario dalla Home per vedere le tue materie."
        testID="study-empty"
      />
    );
  }

  const completedH = selected ? Math.round((selected.completed_minutes / 60) * 10) / 10 : 0;
  const plannedH = selected?.planned_hours ?? 30;
  const color = selected ? subjectColor(selected.color_token, colors) : colors.muted;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={s.title}>Studio</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
        >
          {subjects.data.map((sub) => {
            const active = sub.subject_key === selectedKey;
            return (
              <Pressable
                key={sub.subject_key}
                style={[s.chip, active && s.chipActive]}
                onPress={() => setSelectedKey(sub.subject_key)}
                testID={`subject-chip-${sub.subject_key}`}
              >
                <Dot color={subjectColor(sub.color_token, colors)} size={8} />
                <Text style={[s.chipText, active && s.chipTextActive]}>{sub.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {selected ? (
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.progressCard}>
            <View style={s.cardHead}>
              <Text style={s.subjectName}>{selected.name}</Text>
              <Pressable
                onPress={() => router.push(`/subject-edit?key=${selected.subject_key}`)}
                testID="subject-edit-button"
              >
                <PencilSimple size={20} color={colors.muted} />
              </Pressable>
            </View>
            {selected.docente ? <Text style={s.docente}>{selected.docente}</Text> : null}

            <View>
              <SectionLabel>Progresso</SectionLabel>
              <View style={[s.hoursRow, { marginTop: spacing.sm, marginBottom: spacing.sm }]}>
                <Text style={s.hoursBig}>{completedH}</Text>
                <Text style={s.hoursMuted}>/ {plannedH} ore</Text>
              </View>
              <ProgressBar ratio={completedH / Math.max(plannedH, 1)} color={color} />
            </View>

            <View style={s.examRow}>
              <CalendarBlank size={16} color={colors.muted} />
              <Text style={s.examText}>
                {selected.exam_date
                  ? `Esame: ${parseRome(`${selected.exam_date}T00:00:00`).format("D MMMM YYYY")}`
                  : "Nessuna data esame impostata"}
              </Text>
            </View>
          </View>

          <View>
            <View style={s.sectionHead}>
              <SectionLabel>Task &amp; Argomenti</SectionLabel>
              <Pressable
                style={s.addBtn}
                onPress={() => router.push(`/add-task?subject=${selected.subject_key}`)}
                testID="add-subject-task"
              >
                <Plus size={16} color={colors.info} weight="bold" />
                <Text style={s.addText}>Aggiungi</Text>
              </Pressable>
            </View>
            {subjectTasks.length ? (
              subjectTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={() =>
                    updateTask.mutate({ id: t.id, status: t.status === "done" ? "todo" : "done" })
                  }
                  onPress={() => router.push(`/add-task?id=${t.id}`)}
                />
              ))
            ) : (
              <Text style={[s.docente, { paddingVertical: spacing.md }]}>
                Nessun task. Aggiungi argomenti da studiare.
              </Text>
            )}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}
