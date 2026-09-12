import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle, Plus } from "phosphor-react-native";

import { useTasks, useUpdateTask } from "@/src/api/hooks";
import { TaskRow } from "@/src/components/task-row";
import { EmptyState, LoadingView, SectionLabel } from "@/src/components/ui";
import { nowRome, todayYmd } from "@/src/lib/time";
import type { Task } from "@/src/models";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  title: { fontSize: 28, fontWeight: "700", color: c.onSurface, letterSpacing: -0.5 },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  group: { marginBottom: spacing.lg },
  groupLabel: { marginBottom: spacing.xs },
  fab: {
    position: "absolute",
    right: spacing.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: c.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
}));

export default function TasksScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tasks = useTasks();
  const updateTask = useUpdateTask();

  const groups = useMemo(() => {
    const today = todayYmd();
    const weekEnd = nowRome().add(7, "day").format("YYYY-MM-DD");
    const all = tasks.data ?? [];
    const overdue: Task[] = [];
    const todayG: Task[] = [];
    const week: Task[] = [];
    const done: Task[] = [];
    for (const t of all) {
      if (t.status === "done") {
        done.push(t);
        continue;
      }
      if (t.due_date && t.due_date < today) overdue.push(t);
      else if (t.due_date === today) todayG.push(t);
      else if (!t.due_date || t.due_date <= weekEnd) week.push(t);
      else week.push(t);
    }
    return { overdue, todayG, week, done };
  }, [tasks.data]);

  const toggle = (t: Task) =>
    updateTask.mutate({ id: t.id, status: t.status === "done" ? "todo" : "done" });

  const renderGroup = (label: string, items: Task[], showDue = true) =>
    items.length ? (
      <View style={s.group} key={label}>
        <View style={s.groupLabel}>
          <SectionLabel>{`${label} · ${items.length}`}</SectionLabel>
        </View>
        {items.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            showDue={showDue}
            onToggle={() => toggle(t)}
            onPress={() => router.push(`/add-task?id=${t.id}`)}
          />
        ))}
      </View>
    ) : null;

  const total =
    groups.overdue.length + groups.todayG.length + groups.week.length + groups.done.length;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={s.title}>Task</Text>
      </View>
      {tasks.isLoading ? (
        <LoadingView />
      ) : total === 0 ? (
        <EmptyState
          icon={<CheckCircle size={40} color={colors.borderStrong} />}
          title="Tutto completato"
          subtitle="Non hai task in sospeso. Tocca + per aggiungerne una."
          testID="tasks-empty"
        />
      ) : (
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          {renderGroup("In ritardo", groups.overdue)}
          {renderGroup("Oggi", groups.todayG)}
          {renderGroup("Questa settimana", groups.week)}
          {renderGroup("Completati", groups.done)}
        </ScrollView>
      )}
      <Pressable
        style={[s.fab, { bottom: spacing.md }]}
        onPress={() => router.push("/add-task")}
        testID="tasks-fab"
      >
        <Plus size={24} color={colors.onBrandPrimary} weight="bold" />
      </Pressable>
    </View>
  );
}
