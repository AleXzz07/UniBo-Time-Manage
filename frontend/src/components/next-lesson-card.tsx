import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Clock, MapPin } from "phosphor-react-native";

import { countdownTo } from "@/src/lib/time";
import type { Lesson } from "@/src/models";
import { Dot, SectionLabel } from "@/src/components/ui";
import { makeStyles, radius, spacing, subjectColor, useTheme } from "@/src/theme";

function useCountdown(iso: string): string {
  const [label, setLabel] = useState(() => countdownTo(iso));
  useEffect(() => {
    setLabel(countdownTo(iso));
    const t = setInterval(() => setLabel(countdownTo(iso)), 30000);
    return () => clearInterval(t);
  }, [iso]);
  return label;
}

const useStyles = makeStyles((c) => ({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceSecondary,
    overflow: "hidden",
  },
  accent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  subject: { fontSize: 20, fontWeight: "700", color: c.onSurface, letterSpacing: -0.3, flex: 1 },
  time: { fontSize: 15, color: c.onSurfaceSecondary, marginTop: spacing.xs, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  meta: { fontSize: 14, color: c.muted },
  countdownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: spacing.md,
    backgroundColor: c.surfaceInverse,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  countdownText: { color: c.onSurfaceInverse, fontWeight: "700", fontSize: 14 },
}));

export function NextLessonCard({ lesson, onPress }: { lesson: Lesson; onPress: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const color = subjectColor(lesson.color_token, colors);
  const countdown = useCountdown(lesson.start);

  return (
    <Pressable
      testID="next-lesson-card"
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
    >
      <View style={[s.accent, { backgroundColor: color }]} />
      <View style={s.headerRow}>
        <SectionLabel>Prossima lezione</SectionLabel>
        <Clock size={16} color={colors.muted} />
      </View>
      <View style={s.subjectRow}>
        <Dot color={color} />
        <Text style={s.subject} numberOfLines={2}>
          {lesson.subject_name}
        </Text>
      </View>
      <Text style={s.time}>
        {lesson.start_time} – {lesson.end_time}
      </Text>
      {lesson.aula ? (
        <View style={s.metaRow}>
          <MapPin size={14} color={colors.muted} />
          <Text style={s.meta}>
            {lesson.aula}
            {lesson.indirizzo ? ` · ${lesson.indirizzo}` : ""}
          </Text>
        </View>
      ) : null}
      <View style={s.countdownPill}>
        <Clock size={14} color={colors.onSurfaceInverse} weight="bold" />
        <Text style={s.countdownText}>{countdown}</Text>
      </View>
    </Pressable>
  );
}
