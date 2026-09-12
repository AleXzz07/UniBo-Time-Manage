import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  trigger: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  value: { fontSize: 16, color: c.onSurface, fontWeight: "500" },
  iosSheet: { alignItems: "center", marginTop: spacing.sm },
  done: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 4 },
  doneText: { color: c.info, fontWeight: "600", fontSize: 15 },
}));

export function PickerField({
  mode,
  value,
  onChange,
  testID,
}: {
  mode: "date" | "time";
  value: Date;
  onChange: (d: Date) => void;
  testID?: string;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const label =
    mode === "date"
      ? value.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long" })
      : value.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  const handleChange = (event: any, d?: Date) => {
    if (Platform.OS === "android") setShow(false);
    if (event?.type === "dismissed") return;
    if (d) onChange(d);
  };

  return (
    <View>
      <Pressable style={s.trigger} onPress={() => setShow((v) => !v)} testID={testID}>
        <Text style={s.value}>{label}</Text>
      </Pressable>
      {show && Platform.OS === "ios" ? (
        <View style={s.iosSheet}>
          <DateTimePicker
            value={value}
            mode={mode}
            display="spinner"
            themeVariant={colors.surface === "#0A0A0A" ? "dark" : "light"}
            onChange={handleChange}
          />
          <Pressable style={s.done} onPress={() => setShow(false)}>
            <Text style={s.doneText}>Fatto</Text>
          </Pressable>
        </View>
      ) : null}
      {show && Platform.OS !== "ios" ? (
        <DateTimePicker value={value} mode={mode} display="default" onChange={handleChange} />
      ) : null}
    </View>
  );
}
