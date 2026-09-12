import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Coffee, Sparkle } from "phosphor-react-native";

import { minutesToLabel } from "@/src/lib/time";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", gap: spacing.md },
  timeCol: { width: 46, alignItems: "flex-end", paddingTop: 2 },
  start: { fontSize: 13, fontWeight: "700", color: c.onSurface },
  end: { fontSize: 12, color: c.muted, marginTop: 2 },
  bar: { width: 3, borderRadius: 2, marginTop: 4, marginBottom: 4 },
  content: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontWeight: "600", color: c.onSurface, flex: 1 },
  subtitle: { fontSize: 13, color: c.muted, marginTop: 2 },
  done: { textDecorationLine: "line-through", color: c.muted },

  freeContent: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
  freeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  freeMinutes: { fontSize: 13, fontWeight: "700", color: c.onSurface },
  freeLabel: { fontSize: 13, color: c.muted },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  suggestText: { flex: 1, fontSize: 13, color: c.onSurfaceSecondary },
  planBtn: {
    backgroundColor: c.brandPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  planBtnText: { color: c.onBrandPrimary, fontSize: 13, fontWeight: "600" },
}));

export function EventRow({
  startTime,
  endTime,
  title,
  subtitle,
  color,
  tint,
  done,
  right,
  onPress,
  testID,
}: {
  startTime: string;
  endTime: string;
  title: string;
  subtitle?: string;
  color: string;
  tint?: boolean;
  done?: boolean;
  right?: ReactNode;
  onPress?: () => void;
  testID?: string;
}) {
  const s = useStyles();
  const bg = tint ? `${color}22` : undefined;
  return (
    <View style={s.row}>
      <View style={s.timeCol}>
        <Text style={s.start}>{startTime}</Text>
        <Text style={s.end}>{endTime}</Text>
      </View>
      <View style={[s.bar, { backgroundColor: color }]} />
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [s.content, bg ? { backgroundColor: bg } : null, pressed && onPress ? { opacity: 0.8 } : null]}
      >
        <View style={s.titleRow}>
          <Text style={[s.title, done && s.done]} numberOfLines={2}>
            {title}
          </Text>
          {right}
        </View>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </Pressable>
    </View>
  );
}

export function FreeSlotRow({
  startTime,
  endTime,
  minutes,
  suggestion,
  onPlan,
}: {
  startTime: string;
  endTime: string;
  minutes: number;
  suggestion?: string;
  onPlan: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.row}>
      <View style={s.timeCol}>
        <Text style={s.start}>{startTime}</Text>
        <Text style={s.end}>{endTime}</Text>
      </View>
      <View style={[s.bar, { backgroundColor: colors.border }]} />
      <View style={s.freeContent}>
        <View style={s.freeHeader}>
          <Text style={s.freeMinutes}>{minutesToLabel(minutes)} liberi</Text>
          <Coffee size={16} color={colors.muted} />
        </View>
        {suggestion ? (
          <View style={s.suggestRow}>
            <Sparkle size={14} color={colors.warning} weight="fill" />
            <Text style={s.suggestText}>{suggestion}</Text>
          </View>
        ) : null}
        <Pressable style={s.planBtn} onPress={onPlan} testID="plan-study-button">
          <Text style={s.planBtnText}>Pianifica studio</Text>
        </Pressable>
      </View>
    </View>
  );
}
