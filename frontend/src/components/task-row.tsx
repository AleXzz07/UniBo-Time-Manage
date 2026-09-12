import { Pressable, Text, View } from "react-native";
import { CircleIcon as Circle, CheckCircle } from "phosphor-react-native";

import { parseRome, todayYmd } from "@/src/lib/time";
import type { Task } from "@/src/models";
import { Dot } from "@/src/components/ui";
import { makeStyles, spacing, subjectColor, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  body: { flex: 1 },
  title: { fontSize: 16, color: c.onSurface },
  done: { textDecorationLine: "line-through", color: c.muted },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  meta: { fontSize: 13, color: c.muted },
  overdue: { color: c.error, fontWeight: "600" },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tag: { fontSize: 12, color: c.muted },
  priorityBar: { width: 3, height: 16, borderRadius: 2 },
}));

const PRIORITY_COLOR: Record<string, keyof ReturnType<typeof useTheme>["colors"]> = {
  high: "error",
  medium: "warning",
  low: "muted",
};

export function TaskRow({
  task,
  onToggle,
  onPress,
  showDue = true,
}: {
  task: Task;
  onToggle: () => void;
  onPress?: () => void;
  showDue?: boolean;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const done = task.status === "done";
  const overdue =
    !done &&
    task.due_date &&
    parseRome(`${task.due_date}T23:59:59`).isBefore(parseRome(`${todayYmd()}T00:00:00`));

  const dueLabel = task.due_date
    ? parseRome(`${task.due_date}T00:00:00`).format("D MMM")
    : null;

  return (
    <View style={s.row}>
      <Pressable onPress={onToggle} hitSlop={8} testID={`task-toggle-${task.id}`}>
        {done ? (
          <CheckCircle size={24} color={colors.success} weight="fill" />
        ) : (
          <Circle size={24} color={colors.borderStrong} />
        )}
      </Pressable>
      <Pressable style={s.body} onPress={onPress} disabled={!onPress} testID={`task-row-${task.id}`}>
        <Text style={[s.title, done && s.done]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={s.metaRow}>
          {showDue && dueLabel ? (
            <Text style={[s.meta, overdue ? s.overdue : null]}>{dueLabel}</Text>
          ) : null}
          {task.subject_name ? (
            <View style={s.tagRow}>
              <Dot color={subjectColor(task.color_token, colors)} size={7} />
              <Text style={s.tag} numberOfLines={1}>
                {task.subject_name}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      {!done ? (
        <View
          style={[s.priorityBar, { backgroundColor: colors[PRIORITY_COLOR[task.priority]] as string }]}
        />
      ) : null}
    </View>
  );
}
