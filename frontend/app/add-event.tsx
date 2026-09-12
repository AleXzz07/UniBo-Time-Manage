import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCreatePersonalEvent } from "@/src/api/hooks";
import { PickerField } from "@/src/components/date-picker-field";
import { FieldLabel, TextField } from "@/src/components/form";
import { ModalHeader } from "@/src/components/modal-header";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { padding: spacing.md, gap: spacing.lg },
  field: { gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  col: { flex: 1, gap: spacing.sm },
  error: { color: c.error, fontSize: 13 },
}));

export default function AddEvent() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const createEvent = useCreatePersonalEvent();

  const base = params.date ? new Date(`${params.date}T09:00:00`) : new Date();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>(base);
  const [start, setStart] = useState<Date>(base);
  const [end, setEnd] = useState<Date>(new Date(base.getTime() + 60 * 60 * 1000));
  const [notes, setNotes] = useState("");

  const valid = title.trim().length > 0 && end.getTime() > start.getTime();

  const save = () => {
    const day = dayjs(date).format("YYYY-MM-DD");
    const startISO = `${day}T${dayjs(start).format("HH:mm")}:00`;
    const endISO = `${day}T${dayjs(end).format("HH:mm")}:00`;
    createEvent.mutate(
      { title: title.trim(), date: day, start: startISO, end: endISO, notes: notes.trim() || null },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <View style={s.root}>
      <ModalHeader
        title="Nuovo impegno"
        onClose={() => router.back()}
        actionLabel="Salva"
        onAction={save}
        actionDisabled={!valid}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl }]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.field}>
          <FieldLabel>Titolo</FieldLabel>
          <TextField value={title} onChangeText={setTitle} placeholder="Es. Palestra, Studio di gruppo" autoFocus testID="event-title" />
        </View>
        <View style={s.field}>
          <FieldLabel>Data</FieldLabel>
          <PickerField mode="date" value={date} onChange={setDate} testID="event-date" />
        </View>
        <View style={s.row}>
          <View style={s.col}>
            <FieldLabel>Inizio</FieldLabel>
            <PickerField mode="time" value={start} onChange={setStart} testID="event-start" />
          </View>
          <View style={s.col}>
            <FieldLabel>Fine</FieldLabel>
            <PickerField mode="time" value={end} onChange={setEnd} testID="event-end" />
          </View>
        </View>
        {!valid && title.trim().length > 0 ? (
          <Text style={s.error}>L&apos;ora di fine deve essere dopo l&apos;inizio.</Text>
        ) : null}
        <View style={s.field}>
          <FieldLabel>Note</FieldLabel>
          <TextField value={notes} onChangeText={setNotes} placeholder="Note opzionali" multiline testID="event-notes" />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
