import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Buildings,
  Clock,
  GraduationCap,
  MapPin,
  VideoCamera,
} from "phosphor-react-native";

import { api } from "@/src/api/client";
import { ModalHeader } from "@/src/components/modal-header";
import { Dot, LoadingView, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { parseRome } from "@/src/lib/time";
import type { Lesson } from "@/src/models";
import { makeStyles, spacing, subjectColor, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { padding: spacing.md, gap: spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 24, fontWeight: "700", color: c.onSurface, flex: 1, letterSpacing: -0.4 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.divider },
  rowLabel: { fontSize: 12, color: c.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  rowValue: { fontSize: 16, color: c.onSurface, marginTop: 2 },
  rowContent: { flex: 1 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  source: { fontSize: 12, color: c.muted, textAlign: "center", marginTop: spacing.sm },
}));

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const s = useStyles();
  return (
    <View style={s.row}>
      {icon}
      <View style={s.rowContent}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function LessonDetail() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => api.get<Lesson>(`/lessons/${id}`),
    enabled: !!id,
  });

  const openMaps = () => {
    if (!lesson?.indirizzo) return;
    const q = encodeURIComponent(lesson.indirizzo);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  return (
    <View style={s.root}>
      <ModalHeader title="Dettaglio lezione" onClose={() => router.back()} />
      {isLoading || !lesson ? (
        <LoadingView />
      ) : (
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.titleRow}>
            <Dot color={subjectColor(lesson.color_token, colors)} size={12} />
            <Text style={s.title}>{lesson.subject_name}</Text>
          </View>

          {lesson.docente ? (
            <Row icon={<GraduationCap size={20} color={colors.muted} />} label="Docente" value={lesson.docente} />
          ) : null}
          <Row
            icon={<Clock size={20} color={colors.muted} />}
            label="Orario"
            value={`${parseRome(lesson.start).format("dddd D MMMM")} · ${lesson.start_time} – ${lesson.end_time}`}
          />
          {lesson.aula ? (
            <Row icon={<MapPin size={20} color={colors.muted} />} label="Aula" value={`${lesson.aula}${lesson.piano ? ` · ${lesson.piano}` : ""}`} />
          ) : null}
          {lesson.edificio ? (
            <Row icon={<Buildings size={20} color={colors.muted} />} label="Edificio" value={lesson.edificio} />
          ) : null}
          {lesson.indirizzo ? (
            <Row icon={<MapPin size={20} color={colors.muted} />} label="Indirizzo" value={`${lesson.indirizzo} · ${lesson.campus}`} />
          ) : null}
          {lesson.teledidattica ? (
            <Row icon={<VideoCamera size={20} color={colors.muted} />} label="Modalità" value="Disponibile in teledidattica" />
          ) : null}

          <View style={s.actions}>
            {lesson.indirizzo ? <PrimaryButton label="Apri in Mappe" onPress={openMaps} testID="open-maps" /> : null}
            <SecondaryButton
              label="Apri su UniBo"
              onPress={() => Linking.openURL(lesson.source_url)}
              testID="open-unibo"
            />
          </View>
          <Text style={s.source}>
            Fonte: orario ufficiale UniBo · Aggiornato il{" "}
            {parseRome(lesson.last_updated).format("D MMM [alle] HH:mm")}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
