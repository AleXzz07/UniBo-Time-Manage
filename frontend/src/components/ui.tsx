import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { ArrowClockwise, IconProps } from "phosphor-react-native";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

// ---- Text ----------------------------------------------------------------
const useTextStyles = makeStyles((c) => ({
  display: { fontSize: 28, fontWeight: "700", color: c.onSurface, letterSpacing: -0.5 },
  title: { fontSize: 20, fontWeight: "700", color: c.onSurface, letterSpacing: -0.3 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    color: c.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  body: { fontSize: 16, color: c.onSurface },
  muted: { fontSize: 14, color: c.muted },
}));

export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTextStyles();
  return <Text style={[t.section, style as any]}>{children}</Text>;
}

// ---- Buttons -------------------------------------------------------------
const useBtnStyles = makeStyles((c) => ({
  primary: {
    backgroundColor: c.brandPrimary,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: c.onBrandPrimary, fontSize: 16, fontWeight: "600" },
  secondary: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: c.onSurfaceTertiary, fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.5 },
}));

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const s = useBtnStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.primary, (disabled || loading) && s.disabled, pressed && { opacity: 0.85 }]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onBrandPrimary} />
      ) : (
        <Text style={s.primaryText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const s = useBtnStyles();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [s.secondary, pressed && { opacity: 0.7 }]}
    >
      <Text style={s.secondaryText}>{label}</Text>
    </Pressable>
  );
}

// ---- States --------------------------------------------------------------
const useStateStyles = makeStyles((c) => ({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: c.onSurface, marginTop: spacing.md, textAlign: "center" },
  emptySub: { fontSize: 14, color: c.muted, marginTop: spacing.xs, textAlign: "center", lineHeight: 20 },
  errText: { fontSize: 14, color: c.muted, marginTop: spacing.sm, textAlign: "center" },
  retry: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  retryText: { color: c.onSurface, fontWeight: "600" },
}));

export function LoadingView({ label }: { label?: string }) {
  const s = useStateStyles();
  const { colors } = useTheme();
  const t = useTextStyles();
  return (
    <View style={s.center} testID="loading-view">
      <ActivityIndicator color={colors.onSurface} />
      {label ? <Text style={[t.muted, { marginTop: spacing.md }]}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  testID,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  testID?: string;
}) {
  const s = useStateStyles();
  return (
    <View style={s.center} testID={testID ?? "empty-state"}>
      {icon}
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={s.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const s = useStateStyles();
  const { colors } = useTheme();
  return (
    <View style={s.center} testID="error-view">
      <Text style={s.emptyTitle}>Qualcosa è andato storto</Text>
      {message ? <Text style={s.errText}>{message}</Text> : null}
      {onRetry ? (
        <Pressable style={s.retry} onPress={onRetry} testID="retry-button">
          <ArrowClockwise size={16} color={colors.onSurface} weight="bold" />
          <Text style={s.retryText}>Riprova</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---- Progress ------------------------------------------------------------
const useProgressStyles = makeStyles((c) => ({
  track: { height: 6, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary, overflow: "hidden" },
}));

export function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
  const s = useProgressStyles();
  const pct = Math.max(0, Math.min(1, ratio));
  return (
    <View style={s.track}>
      <View style={{ height: 6, width: `${pct * 100}%`, backgroundColor: color, borderRadius: radius.pill }} />
    </View>
  );
}

// ---- Dot -----------------------------------------------------------------
export function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

export function iconColorProps(color: string): Partial<IconProps> {
  return { color, weight: "regular" };
}
