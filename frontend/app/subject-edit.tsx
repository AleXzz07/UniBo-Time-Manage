import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Minus, Plus } from "phosphor-react-native";

import { useSubjects, useUpdateSubject } from "@/src/api/hooks";
import { PickerField } from "@/src/components/date-picker-field";
import { FieldLabel, TextField } from "@/src/components/form";
import { ModalHeader } from "@/src/components/modal-header";
import { LoadingView } from "@/src/components/ui";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { padding: spacing.md, gap: spacing.lg },
  field: { gap: spacing.sm },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: { fontSize: 18, fontWeight: "700", color: c.onSurface },
  dueHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
}));

export default function SubjectEdit() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();

  const subjects = useSubjects();
  const updateSubject = useUpdateSubject();
  const subject = subjects.data?.find((x) => x.subject_key === key);

  const [hours, setHours] = useState<number>(subject?.planned_hours ?? 30);
  const [hasExam, setHasExam] = useState<boolean>(!!subject?.exam_date);
  const [exam, setExam] = useState<Date>(
    subject?.exam_date ? new Date(`${subject.exam_date}T12:00:00`) : new Date(),
  );
  const [topics, setTopics] = useState<string>((subject?.topics ?? []).join(", "));

  if (subjects.isLoading || !subject) return <LoadingView />;

  const save = () => {
    updateSubject.mutate(
      {
        subject_key: subject.subject_key,
        planned_hours: hours,
        exam_date: hasExam ? dayjs(exam).format("YYYY-MM-DD") : null,
        topics: topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <View style={s.root}>
      <ModalHeader
        title={subject.name}
        onClose={() => router.back()}
        actionLabel="Salva"
        onAction={save}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl }]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.field}>
          <FieldLabel>Ore di studio previste</FieldLabel>
          <View style={s.stepper}>
            <Pressable
              style={s.stepBtn}
              onPress={() => setHours((h) => Math.max(5, h - 5))}
              testID="hours-minus"
            >
              <Minus size={18} color={colors.onSurface} weight="bold" />
            </Pressable>
            <Text style={s.stepValue}>{hours} ore</Text>
            <Pressable style={s.stepBtn} onPress={() => setHours((h) => h + 5)} testID="hours-plus">
              <Plus size={18} color={colors.onSurface} weight="bold" />
            </Pressable>
          </View>
        </View>

        <View style={s.field}>
          <View style={s.dueHeader}>
            <FieldLabel>Data esame</FieldLabel>
            <Switch value={hasExam} onValueChange={setHasExam} testID="subject-has-exam" />
          </View>
          {hasExam ? <PickerField mode="date" value={exam} onChange={setExam} testID="subject-exam-date" /> : null}
        </View>

        <View style={s.field}>
          <FieldLabel>Argomenti (separati da virgola)</FieldLabel>
          <TextField
            value={topics}
            onChangeText={setTopics}
            placeholder="Limiti, Derivate, Integrali"
            multiline
            testID="subject-topics"
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
