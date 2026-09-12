import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowClockwise,
  Gear,
  Sun,
  WarningCircle,
} from "phosphor-react-native";

import {
  useLessons,
  usePersonalEvents,
  useProfile,
  useScheduleChanges,
  useStudySessions,
  useSubjects,
  useSync,
  useSyncStatus,
  useTasks,
  useUpcomingLessons,
} from "@/src/api/hooks";
import { NextLessonCard } from "@/src/components/next-lesson-card";
import { EventRow, FreeSlotRow } from "@/src/components/timeline";
import { EmptyState, LoadingView, SectionLabel } from "@/src/components/ui";
import { greeting, longDate, minutesToLabel, nowRome, parseRome, todayYmd } from "@/src/lib/time";
import type { Lesson, PersonalEvent, StudySession } from "@/src/models";
import { computeFreeSlots, suggestStudyBlocks } from "@/src/planner/freeTime";
import { makeStyles, spacing, subjectColor, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  headerTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  greeting: { fontSize: 28, fontWeight: "700", color: c.onSurface, letterSpacing: -0.5 },
  date: { fontSize: 15, color: c.muted, marginTop: 2 },
  iconBtn: { padding: 6 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: c.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: c.onError, fontSize: 10, fontWeight: "700" },
  scroll: { padding: spacing.md, gap: spacing.lg },
  section: { gap: spacing.sm },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  syncText: { fontSize: 12, color: c.muted },
  changeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: `${"#DDA15E"}22`,
    borderRadius: 12,
    padding: spacing.md,
  },
  changeText: { flex: 1, fontSize: 13, color: c.onSurface, fontWeight: "500" },
  noNext: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: 6,
  },
  noNextText: { color: c.muted, fontSize: 14, textAlign: "center" },
}));

interface TimelineNode {
  key: string;
  sort: number;
  render: () => React.ReactNode;
}

function formatLastSync(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = parseRome(iso);
  const isToday = d.format("YYYY-MM-DD") === todayYmd();
  return isToday ? `oggi alle ${d.format("HH:mm")}` : d.format("D MMM [alle] HH:mm");
}

export default function OggiScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = todayYmd();

  const profile = useProfile();
  const lessonsToday = useLessons(today, today);
  const upcoming = useUpcomingLessons();
  const study = useStudySessions(today, today);
  const personal = usePersonalEvents(today, today);
  const subjects = useSubjects();
  const tasks = useTasks();
  const syncStatus = useSyncStatus();
  const changes = useScheduleChanges();
  const sync = useSync();

  const loading =
    profile.isLoading || lessonsToday.isLoading || upcoming.isLoading || subjects.isLoading;

  const nextLesson: Lesson | undefined = useMemo(() => {
    const now = nowRome();
    const list = upcoming.data ?? [];
    return list.find((l) => parseRome(l.start).isAfter(now));
  }, [upcoming.data]);

  const unreadChanges = (changes.data ?? []).filter((c) => !c.read).length;
  const latestChange = (changes.data ?? []).find((c) => !c.read);

  const { nodes } = useMemo(() => {
    const L: Lesson[] = lessonsToday.data ?? [];
    const St: StudySession[] = study.data ?? [];
    const P: PersonalEvent[] = personal.data ?? [];

    const busy = [
      ...L.map((l) => ({ start: l.start, end: l.end })),
      ...St.map((x) => ({ start: x.start, end: x.end })),
      ...P.map((p) => ({ start: p.start, end: p.end })),
    ];
    const free = computeFreeSlots(today, busy, { minMinutes: 30, fromNow: true });
    const suggestions = suggestStudyBlocks(free, subjects.data ?? []);
    const suggestionByStart = new Map(suggestions.map((x) => [x.start, x]));

    const items: TimelineNode[] = [];

    for (const l of L) {
      items.push({
        key: `l-${l.stable_id}`,
        sort: parseRome(l.start).valueOf(),
        render: () => (
          <EventRow
            key={`l-${l.stable_id}`}
            testID={`timeline-lesson-${l.stable_id}`}
            startTime={l.start_time}
            endTime={l.end_time}
            title={l.subject_name}
            subtitle={[l.aula, l.docente].filter(Boolean).join(" · ") || undefined}
            color={subjectColor(l.color_token, colors)}
            tint
            onPress={() => router.push(`/lesson/${l.stable_id}`)}
          />
        ),
      });
    }
    for (const x of St) {
      items.push({
        key: `s-${x.id}`,
        sort: parseRome(x.start).valueOf(),
        render: () => (
          <EventRow
            key={`s-${x.id}`}
            startTime={parseRome(x.start).format("HH:mm")}
            endTime={parseRome(x.end).format("HH:mm")}
            title={`Studio · ${x.subject_name ?? ""}`}
            subtitle="Sessione di studio"
            color={subjectColor(x.color_token, colors)}
            done={x.completed}
          />
        ),
      });
    }
    for (const p of P) {
      items.push({
        key: `p-${p.id}`,
        sort: parseRome(p.start).valueOf(),
        render: () => (
          <EventRow
            key={`p-${p.id}`}
            startTime={parseRome(p.start).format("HH:mm")}
            endTime={parseRome(p.end).format("HH:mm")}
            title={p.title}
            subtitle="Impegno personale"
            color={colors.muted}
          />
        ),
      });
    }
    for (const slot of free) {
      const sug = suggestionByStart.get(slot.start);
      items.push({
        key: `f-${slot.start}`,
        sort: parseRome(slot.start).valueOf(),
        render: () => (
          <FreeSlotRow
            key={`f-${slot.start}`}
            startTime={parseRome(slot.start).format("HH:mm")}
            endTime={parseRome(slot.end).format("HH:mm")}
            minutes={slot.minutes}
            suggestion={
              sug ? `Puoi studiare ${sug.subject_name} per ${minutesToLabel(sug.minutes)}` : undefined
            }
            onPlan={() => router.push("/planner")}
          />
        ),
      });
    }
    items.sort((a, b) => a.sort - b.sort);
    return { nodes: items };
  }, [lessonsToday.data, study.data, personal.data, subjects.data, today, colors, router]);

  if (loading) return <LoadingView label="Sincronizzazione…" />;

  const lastSync = formatLastSync(syncStatus.data?.last_success);
  const syncFailing = syncStatus.data?.status === "cache" || syncStatus.data?.status === "error";

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={s.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting} testID="oggi-greeting">
              {greeting()}
            </Text>
            <Text style={s.date}>{longDate()}</Text>
          </View>
          <View style={s.headerIcons}>
            <Pressable style={s.iconBtn} onPress={() => router.push("/changes")} testID="changes-button">
              <WarningCircle size={24} color={colors.onSurface} />
              {unreadChanges > 0 ? (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{unreadChanges}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={s.iconBtn} onPress={() => router.push("/settings")} testID="settings-button">
              <Gear size={24} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>
        {lastSync ? (
          <View style={s.syncRow}>
            {syncFailing ? (
              <WarningCircle size={13} color={colors.warning} weight="fill" />
            ) : (
              <ArrowClockwise size={13} color={colors.muted} />
            )}
            <Text style={s.syncText}>
              {syncFailing ? "Offline · " : ""}Ultimo aggiornamento UniBo: {lastSync}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={sync.isPending}
            onRefresh={() => sync.mutate()}
            tintColor={colors.muted}
          />
        }
      >
        {latestChange ? (
          <Pressable style={s.changeBanner} onPress={() => router.push("/changes")}>
            <WarningCircle size={20} color={colors.warning} weight="fill" />
            <Text style={s.changeText} numberOfLines={2}>
              {latestChange.message}
            </Text>
          </Pressable>
        ) : null}

        <View style={s.section}>
          {nextLesson ? (
            <NextLessonCard
              lesson={nextLesson}
              onPress={() => router.push(`/lesson/${nextLesson.stable_id}`)}
            />
          ) : (
            <View style={s.noNext}>
              <Sun size={28} color={colors.muted} />
              <Text style={s.noNextText}>Nessuna lezione in programma nei prossimi mesi.</Text>
            </View>
          )}
        </View>

        <View style={s.section}>
          <SectionLabel>Oggi</SectionLabel>
          {nodes.length ? (
            <View>{nodes.map((n) => n.render())}</View>
          ) : (
            <EmptyState
              title="Giornata libera"
              subtitle="Nessuna lezione o impegno oggi. Buon riposo o pianifica lo studio."
              testID="oggi-empty"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
