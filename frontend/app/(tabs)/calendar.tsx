import { Dayjs } from "dayjs";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft, CaretRight, Plus } from "phosphor-react-native";

import { useLessons, usePersonalEvents, useStudySessions } from "@/src/api/hooks";
import { CalEvent, DayGrid } from "@/src/components/day-grid";
import { Segmented } from "@/src/components/form";
import { Dot, LoadingView } from "@/src/components/ui";
import { capitalize, nowRome, parseRome, weekDays, ymd } from "@/src/lib/time";
import { makeStyles, radius, spacing, subjectColor, useTheme } from "@/src/theme";

type ViewMode = "day" | "week" | "month";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
    gap: spacing.sm,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "700", color: c.onSurface, letterSpacing: -0.4 },
  navRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  navBtn: { padding: 6 },
  strip: { flexDirection: "row", gap: 6 },
  dayCell: { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: radius.md },
  dayCellActive: { backgroundColor: c.surfaceInverse },
  dayName: { fontSize: 11, color: c.muted, fontWeight: "600" },
  dayNum: { fontSize: 16, color: c.onSurface, fontWeight: "700", marginTop: 2 },
  dayTextActive: { color: c.onSurfaceInverse },
  stripDot: { marginTop: 3, height: 5 },
  gridScroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  fab: {
    position: "absolute",
    right: spacing.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: c.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  // month
  monthGrid: { padding: spacing.md },
  weekHeaderRow: { flexDirection: "row", marginBottom: spacing.sm },
  weekHeaderCell: { flex: 1, alignItems: "center" },
  weekHeaderText: { fontSize: 11, color: c.muted, fontWeight: "700" },
  monthRow: { flexDirection: "row" },
  monthCell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  monthCellInner: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17 },
  monthCellActive: { backgroundColor: c.surfaceInverse },
  monthDayNum: { fontSize: 14, color: c.onSurface },
  monthDayMuted: { color: c.muted, opacity: 0.4 },
  monthDayActive: { color: c.onSurfaceInverse, fontWeight: "700" },
  monthDotsRow: { flexDirection: "row", gap: 3, height: 5 },
}));

export default function CalendarScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [view, setView] = useState<ViewMode>("week");
  const [selected, setSelected] = useState<Dayjs>(nowRome().startOf("day"));

  const focus = selected;
  const rangeStart = ymd(focus.startOf("month").subtract(7, "day"));
  const rangeEnd = ymd(focus.endOf("month").add(7, "day"));

  const lessons = useLessons(rangeStart, rangeEnd);
  const study = useStudySessions(rangeStart, rangeEnd);
  const personal = usePersonalEvents(rangeStart, rangeEnd);

  const loading = lessons.isLoading;

  const eventsForDay = useMemo(() => {
    return (day: string): CalEvent[] => {
      const evs: CalEvent[] = [];
      for (const l of lessons.data ?? []) {
        if (l.date !== day) continue;
        evs.push({
          id: `l-${l.stable_id}`,
          start: l.start,
          end: l.end,
          title: l.subject_name,
          subtitle: l.aula ?? undefined,
          color: subjectColor(l.color_token, colors),
          onPress: () => router.push(`/lesson/${l.stable_id}`),
        });
      }
      for (const x of study.data ?? []) {
        if (x.date !== day) continue;
        evs.push({
          id: `s-${x.id}`,
          start: x.start,
          end: x.end,
          title: `Studio ${x.subject_name ?? ""}`,
          color: subjectColor(x.color_token, colors),
        });
      }
      for (const p of personal.data ?? []) {
        if (p.date !== day) continue;
        evs.push({ id: `p-${p.id}`, start: p.start, end: p.end, title: p.title, color: colors.muted });
      }
      return evs;
    };
  }, [lessons.data, study.data, personal.data, colors, router]);

  const hasEvents = useMemo(() => {
    const set = new Set<string>();
    (lessons.data ?? []).forEach((l) => set.add(l.date));
    (study.data ?? []).forEach((x) => set.add(x.date));
    (personal.data ?? []).forEach((p) => set.add(p.date));
    return set;
  }, [lessons.data, study.data, personal.data]);

  const shift = (dir: number) => {
    if (view === "day") setSelected((d) => d.add(dir, "day"));
    else if (view === "week") setSelected((d) => d.add(dir * 7, "day"));
    else setSelected((d) => d.add(dir, "month"));
  };

  const title =
    view === "month"
      ? capitalize(selected.format("MMMM YYYY"))
      : capitalize(selected.format("MMMM YYYY"));

  const week = weekDays(selected);

  const renderStrip = () => (
    <View style={s.strip}>
      {week.map((d) => {
        const active = d.isSame(selected, "day");
        const has = hasEvents.has(ymd(d));
        return (
          <Pressable
            key={ymd(d)}
            style={[s.dayCell, active && s.dayCellActive]}
            onPress={() => setSelected(d)}
            testID={`week-day-${ymd(d)}`}
          >
            <Text style={[s.dayName, active && s.dayTextActive]}>{capitalize(d.format("dd"))}</Text>
            <Text style={[s.dayNum, active && s.dayTextActive]}>{d.date()}</Text>
            <View style={s.stripDot}>
              {has ? <Dot color={active ? colors.onSurfaceInverse : colors.borderStrong} size={5} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const renderMonth = () => {
    const first = selected.startOf("month");
    const gridStart = first.isoWeekday(1);
    const cells: Dayjs[] = Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));
    const rows: Dayjs[][] = [];
    for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, i * 7 + 7));
    const names = ["L", "M", "M", "G", "V", "S", "D"];
    return (
      <View style={s.monthGrid}>
        <View style={s.weekHeaderRow}>
          {names.map((n, i) => (
            <View key={i} style={s.weekHeaderCell}>
              <Text style={s.weekHeaderText}>{n}</Text>
            </View>
          ))}
        </View>
        {rows.map((row, ri) => (
          <View key={ri} style={s.monthRow}>
            {row.map((d) => {
              const inMonth = d.month() === selected.month();
              const active = d.isSame(selected, "day");
              const dayEvents = eventsForDay(ymd(d)).slice(0, 3);
              return (
                <Pressable
                  key={ymd(d)}
                  style={s.monthCell}
                  onPress={() => {
                    setSelected(d);
                    setView("day");
                  }}
                  testID={`month-day-${ymd(d)}`}
                >
                  <View style={[s.monthCellInner, active && s.monthCellActive]}>
                    <Text
                      style={[
                        s.monthDayNum,
                        !inMonth && s.monthDayMuted,
                        active && s.monthDayActive,
                      ]}
                    >
                      {d.date()}
                    </Text>
                  </View>
                  <View style={s.monthDotsRow}>
                    {dayEvents.map((e) => (
                      <Dot key={e.id} color={e.color} size={4} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={s.titleRow}>
          <Text style={s.title} testID="calendar-title">
            {title}
          </Text>
          <View style={s.navRow}>
            <Pressable style={s.navBtn} onPress={() => shift(-1)} testID="cal-prev">
              <CaretLeft size={20} color={colors.onSurface} weight="bold" />
            </Pressable>
            <Pressable style={s.navBtn} onPress={() => setSelected(nowRome().startOf("day"))} testID="cal-today">
              <Text style={{ color: colors.info, fontWeight: "600" }}>Oggi</Text>
            </Pressable>
            <Pressable style={s.navBtn} onPress={() => shift(1)} testID="cal-next">
              <CaretRight size={20} color={colors.onSurface} weight="bold" />
            </Pressable>
          </View>
        </View>
        <Segmented
          testID="calendar-view-toggle"
          value={view}
          onChange={setView}
          options={[
            { label: "Giorno", value: "day" },
            { label: "Settimana", value: "week" },
            { label: "Mese", value: "month" },
          ]}
        />
        {view === "week" ? renderStrip() : null}
      </View>

      {loading ? (
        <LoadingView />
      ) : view === "month" ? (
        <ScrollView showsVerticalScrollIndicator={false}>{renderMonth()}</ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[s.gridScroll, { paddingBottom: insets.bottom + spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          <DayGrid date={selected} events={eventsForDay(ymd(selected))} />
        </ScrollView>
      )}

      <Pressable
        style={[s.fab, { bottom: spacing.md }]}
        onPress={() => router.push(`/add-event?date=${ymd(selected)}`)}
        testID="calendar-fab"
      >
        <Plus size={24} color={colors.onBrandPrimary} weight="bold" />
      </Pressable>
    </View>
  );
}
