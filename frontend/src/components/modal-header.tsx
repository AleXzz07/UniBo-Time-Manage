import { Pressable, Text, View } from "react-native";
import { X } from "phosphor-react-native";

import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
    backgroundColor: c.surface,
  },
  title: { fontSize: 18, fontWeight: "700", color: c.onSurface, letterSpacing: -0.3 },
  closeBtn: { padding: 4 },
  right: { minWidth: 32, alignItems: "flex-end" },
  action: { fontSize: 16, fontWeight: "600", color: c.info },
}));

export function ModalHeader({
  title,
  onClose,
  actionLabel,
  onAction,
  actionDisabled,
}: {
  title: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.header}>
      <Pressable style={s.closeBtn} onPress={onClose} testID="modal-close">
        <X size={24} color={colors.onSurface} />
      </Pressable>
      <Text style={s.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={s.right}>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} disabled={actionDisabled} testID="modal-action">
            <Text style={[s.action, actionDisabled && { opacity: 0.4 }]}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
