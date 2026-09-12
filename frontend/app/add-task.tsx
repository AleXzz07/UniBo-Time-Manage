import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash } from "phosphor-react-native";

import {
  useCreateTask,
  useDeleteTask,
  useSubjects,
  useTasks,
  useUpdateTask,
} from "@/src/api/hooks";
import { PickerField } from "@/src/components/date-picker-field";
import { FieldLabel, Segmented, TextField } from "@/src/components/form";
import { ModalHeader } from "@/src/components/modal-header";
import { Dot } from "@/src/components/ui";
import type { Priority } from "@/src/models";
import { makeStyles, radius, spacing, subjectColor, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { padding: spacing.md, gap: spacing.lg },
  field: { gap: spacing.sm },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipActive: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  chipText: { fontSize: 13, color: c.onSurface, fontWeight: "600" },
  chipTextActive: { color: c.onSurfaceInverse },
  dueHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  deleteText: { color: c.error, fontWeight: "600", fontSize: 15 },
}));

export default function AddTask() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; subject?: string }>();

  const subjects = useSubjects();
  const tasks = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const editing = tasks.data?.find((t) => t.id === params.id);

  const [title, setTitle] = useState(editing?.title ?? "");
  const [subjectKey, setSubjectKey] = useState<string | null>(
    editing?.subject_key ?? params.subject ?? null,
  );
  const [priority, setPriority] = useState<Priority>(editing?.priority ?? "medium");
  const [estimated, setEstimated] = useState<number>(editing?.estimated_minutes ?? 60);
  const [hasDue, setHasDue] = useState<boolean>(!!editing?.due_date);
  const [due, setDue] = useState<Date>(
    editing?.due_date ? new Date(`${editing.due_date}T12:00:00`) : new Date(),
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const canSave = title.trim().length > 0;

  const save = () => {
    const payload = {
      title: title.trim(),
      subject_key: subjectKey,
      due_date: hasDue ? dayjs(due).format("YYYY-MM-DD") : null,
      estimated_minutes: estimated,
      priority,
      notes: notes.trim() || null,
    };
    if (editing) {
      updateTask.mutate({ id: editing.id, ...payload }, { onSuccess: () => router.back() });
    } else {
      createTask.mutate(payload, { onSuccess: () => router.back() });
    }
  };

  const remove = () => {
    if (editing) deleteTask.mutate(editing.id, { onSuccess: () => router.back() });
  };

  const subjectOptions = useMemo(
    () => [{ subject_key: null, name: "Nessuna", color_token: "subjectCAD" }, ...(subjects.data ?? [])],
    [subjects.data],
  );

  return (
    <View style={s.root}>
      <ModalHeader
        title={editing ? "Modifica task" : "Nuovo task"}
        onClose={() => router.back()}
        actionLabel="Salva"
        onAction={save}
        actionDisabled={!canSave}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl }]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.field}>
          <FieldLabel>Titolo</FieldLabel>
          <TextField value={title} onChangeText={setTitle} placeholder="Es. Esercizi capitolo 3" autoFocus={!editing} testID="task-title" />
        </View>

        <View style={s.field}>
          <FieldLabel>Materia</FieldLabel>
          <View style={s.chipsRow}>
            {subjectOptions.map((sub) => {
              const active = sub.subject_key === subjectKey;
              return (
                <Pressable
                  key={sub.subject_key ?? "none"}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setSubjectKey(sub.subject_key)}
                  testID={`task-subject-${sub.subject_key ?? "none"}`}
                >
                  {sub.subject_key ? <Dot color={subjectColor(sub.color_token, colors)} size={7} /> : null}
                  <Text style={[s.chipText, active && s.chipTextActive]}>{sub.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={s.field}>
          <FieldLabel>Priorità</FieldLabel>
          <Segmented
            testID="task-priority"
            value={priority}
            onChange={setPriority}
            options={[
              { label: "Bassa", value: "low" },
              { label: "Media", value: "medium" },
              { label: "Alta", value: "high" },
            ]}
          />
        </View>

        <View style={s.field}>
          <FieldLabel>Durata stimata</FieldLabel>
          <Segmented
            testID="task-duration"
            value={estimated}
            onChange={setEstimated}
            options={[
              { label: "30m", value: 30 },
              { label: "1h", value: 60 },
              { label: "1h30", value: 90 },
              { label: "2h", value: 120 },
            ]}
          />
        </View>

        <View style={s.field}>
          <View style={s.dueHeader}>
            <FieldLabel>Scadenza</FieldLabel>
            <Switch value={hasDue} onValueChange={setHasDue} testID="task-has-due" />
          </View>
          {hasDue ? <PickerField mode="date" value={due} onChange={setDue} testID="task-due-date" /> : null}
        </View>

        <View style={s.field}>
          <FieldLabel>Note</FieldLabel>
          <TextField value={notes} onChangeText={setNotes} placeholder="Note opzionali" multiline testID="task-notes" />
        </View>

        {editing ? (
          <Pressable style={s.deleteBtn} onPress={remove} testID="task-delete">
            <Trash size={18} color={colors.error} />
            <Text style={s.deleteText}>Elimina task</Text>
          </Pressable>
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}
