import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GraduationCap } from "phosphor-react-native";

import { useOnboarding } from "@/src/api/hooks";
import { FieldLabel, Segmented, TextField } from "@/src/components/form";
import { PrimaryButton } from "@/src/components/ui";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: { gap: spacing.sm, marginBottom: spacing.sm },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: c.surfaceInverse,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "700", color: c.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: c.muted, lineHeight: 21 },
  field: { gap: spacing.sm },
  courseCard: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    gap: 2,
  },
  courseName: { fontSize: 16, fontWeight: "600", color: c.onSurface },
  courseMeta: { fontSize: 13, color: c.muted },
  error: { color: c.error, fontSize: 13 },
}));

export default function Onboarding() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const onboarding = useOnboarding();

  const [name, setName] = useState("");
  const [year, setYear] = useState<number>(1);
  const [group, setGroup] = useState<string>("none");

  const submit = () => {
    onboarding.mutate(
      {
        name: name.trim() || "Studente",
        course_id: "ingegneria-meccanica-bologna",
        academic_year: "2026/2027",
        year_of_course: year,
        curriculum: null,
        group: group === "none" ? null : group,
      },
      { onSuccess: () => router.replace("/(tabs)") },
    );
  };

  return (
    <View style={s.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          <View style={s.logo}>
            <GraduationCap size={28} color={colors.onSurfaceInverse} weight="fill" />
          </View>
          <Text style={s.title}>Benvenuto</Text>
          <Text style={s.subtitle}>
            Organizza la tua vita universitaria. Configura il tuo corso per iniziare.
          </Text>
        </View>

        <View style={s.field}>
          <FieldLabel>Come ti chiami?</FieldLabel>
          <TextField value={name} onChangeText={setName} placeholder="Il tuo nome" testID="onboarding-name" />
        </View>

        <View style={s.field}>
          <FieldLabel>Corso di laurea</FieldLabel>
          <View style={s.courseCard} testID="onboarding-course">
            <Text style={s.courseName}>Ingegneria Meccanica</Text>
            <Text style={s.courseMeta}>Università di Bologna · Laurea · Campus Bologna</Text>
          </View>
        </View>

        <View style={s.field}>
          <FieldLabel>Anno di corso</FieldLabel>
          <Segmented
            testID="onboarding-year"
            value={year}
            onChange={setYear}
            options={[
              { label: "1° Anno", value: 1 },
              { label: "2° Anno", value: 2 },
              { label: "3° Anno", value: 3 },
            ]}
          />
        </View>

        <View style={s.field}>
          <FieldLabel>Gruppo / Canale</FieldLabel>
          <Segmented
            testID="onboarding-group"
            value={group}
            onChange={setGroup}
            options={[
              { label: "A–K", value: "A-K" },
              { label: "L–Z", value: "L-Z" },
              { label: "Tutti", value: "none" },
            ]}
          />
        </View>

        {onboarding.isError ? (
          <Text style={s.error}>Errore durante la configurazione. Riprova.</Text>
        ) : null}

        <PrimaryButton
          label="Inizia"
          onPress={submit}
          loading={onboarding.isPending}
          testID="onboarding-submit"
        />
      </KeyboardAwareScrollView>
    </View>
  );
}
