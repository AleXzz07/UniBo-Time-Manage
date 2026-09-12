import { ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: c.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: c.onSurface,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: "top" },
  segmentRow: { flexDirection: "row", backgroundColor: c.surfaceTertiary, borderRadius: radius.md, padding: 3, gap: 3 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: "center" },
  segmentActive: { backgroundColor: c.surface },
  segmentText: { fontSize: 14, color: c.muted, fontWeight: "600" },
  segmentTextActive: { color: c.onSurface },
}));

export function FieldLabel({ children }: { children: ReactNode }) {
  const s = useStyles();
  return <Text style={s.label}>{children}</Text>;
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  multiline,
  autoFocus,
  testID,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  testID?: string;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      multiline={multiline}
      autoFocus={autoFocus}
      style={[s.input, multiline && s.inputMultiline]}
    />
  );
}

export interface SegmentOption<T> {
  label: string;
  value: T;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  testID,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  testID?: string;
}) {
  const s = useStyles();
  return (
    <View style={s.segmentRow} testID={testID}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            style={[s.segment, active && s.segmentActive]}
            onPress={() => onChange(opt.value)}
            testID={`segment-${opt.value}`}
          >
            <Text style={[s.segmentText, active && s.segmentTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
