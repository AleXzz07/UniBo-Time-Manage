import { Dayjs } from "dayjs";
import { Fragment } from "react";
import { Pressable, Text, View } from "react-native";

import { nowRome, parseRome } from "@/src/lib/time";
import { makeStyles, radius, useTheme } from "@/src/theme";

export interface CalEvent {
  id: string;
  start: string;
  end: string;
  title: string;
  subtitle?: string;
  color: string;
  onPress?: () => void;
}

const START_HOUR = 8;
const END_HOUR = 21;
const HOUR_HEIGHT = 62;
const AXIS_WIDTH = 44;

const useStyles = makeStyles((c) => ({
  container: { flexDirection: "row" },
  axis: { width: AXIS_WIDTH },
  hourLabel: { fontSize: 11, color: c.muted, textAlign: "right", paddingRight: 8, marginTop: -6 },
  grid: { flex: 1, position: "relative" },
  hourLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: c.divider },
  block: {
    position: "absolute",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
    borderLeftWidth: 3,
  },
  blockTitle: { fontSize: 12, fontWeight: "700", color: c.onSurface },
  blockSub: { fontSize: 11, color: c.onSurfaceSecondary, marginTop: 1 },
  nowLine: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: c.error },
  nowDot: { position: "absolute", left: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: c.error, marginTop: -3 },
}));

interface Positioned extends CalEvent {
  top: number;
  height: number;
  col: number;
  cols: number;
}

function layout(events: CalEvent[]): Positioned[] {
  const sorted = [...events].sort(
    (a, b) => parseRome(a.start).valueOf() - parseRome(b.start).valueOf(),
  );
  const result: Positioned[] = [];
  let cluster: Positioned[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const cols = Math.max(...cluster.map((e) => e.col + 1), 1);
    cluster.forEach((e) => (e.cols = cols));
    result.push(...cluster);
    cluster = [];
  };

  for (const ev of sorted) {
    const startMin = (parseRome(ev.start).hour() - START_HOUR) * 60 + parseRome(ev.start).minute();
    const endMin = (parseRome(ev.end).hour() - START_HOUR) * 60 + parseRome(ev.end).minute();
    const top = Math.max(0, startMin) * (HOUR_HEIGHT / 60);
    const height = Math.max(24, (endMin - startMin) * (HOUR_HEIGHT / 60) - 2);
    const startVal = parseRome(ev.start).valueOf();

    if (startVal >= clusterEnd && cluster.length) flush();

    // assign a free column within the current cluster
    const used = new Set(cluster.filter((c) => c.end > ev.start).map((c) => c.col));
    let col = 0;
    while (used.has(col)) col += 1;

    const p: Positioned = { ...ev, top, height, col, cols: 1 };
    cluster.push(p);
    clusterEnd = Math.max(clusterEnd, parseRome(ev.end).valueOf());
  }
  if (cluster.length) flush();
  return result;
}

export function DayGrid({ date, events }: { date: Dayjs; events: CalEvent[] }) {
  const s = useStyles();
  const { colors } = useTheme();
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const positioned = layout(events);
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  const isToday = date.format("YYYY-MM-DD") === nowRome().format("YYYY-MM-DD");
  const now = nowRome();
  const nowTop = ((now.hour() - START_HOUR) * 60 + now.minute()) * (HOUR_HEIGHT / 60);
  const showNow = isToday && now.hour() >= START_HOUR && now.hour() < END_HOUR;

  return (
    <View style={[s.container, { height: totalHeight + 20 }]}>
      <View style={s.axis}>
        {hours.map((h, i) => (
          <Text key={h} style={[s.hourLabel, { position: "absolute", top: i * HOUR_HEIGHT }]}>
            {String(h).padStart(2, "0")}:00
          </Text>
        ))}
      </View>
      <View style={s.grid}>
        {hours.map((h, i) => (
          <View key={h} style={[s.hourLine, { top: i * HOUR_HEIGHT }]} />
        ))}
        {positioned.map((e) => {
          const gap = 3;
          const widthPct = 100 / e.cols;
          return (
            <Pressable
              key={e.id}
              testID={`cal-event-${e.id}`}
              onPress={e.onPress}
              disabled={!e.onPress}
              style={[
                s.block,
                {
                  top: e.top,
                  height: e.height,
                  left: `${e.col * widthPct}%`,
                  width: `${widthPct}%`,
                  marginLeft: e.col === 0 ? 0 : gap,
                  backgroundColor: `${e.color}2E`,
                  borderLeftColor: e.color,
                },
              ]}
            >
              <Text style={s.blockTitle} numberOfLines={1}>
                {e.title}
              </Text>
              {e.subtitle && e.height > 34 ? (
                <Text style={s.blockSub} numberOfLines={1}>
                  {e.subtitle}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
        {showNow ? (
          <Fragment>
            <View style={[s.nowDot, { top: nowTop }]} />
            <View style={[s.nowLine, { top: nowTop }]} />
          </Fragment>
        ) : null}
      </View>
    </View>
  );
}
