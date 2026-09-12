import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProfile, useStudySessions, useSync, useSyncStatus, useTasks, useUpcomingLessons } from "@/src/api/hooks";
import { Segmented } from "@/src/components/form";
import { ModalHeader } from "@/src/components/modal-header";
import { SecondaryButton } from "@/src/components/ui";
import { parseRome, todayYmd } from "@/src/lib/time";
import {
  DEFAULT_NOTIF_SETTINGS,
  NotifSettings,
  ensurePermissions,
  getNotifSettings,
  rescheduleAll,
  setNotifSettings,
} from "@/src/notifications";
import { setColorScheme, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";

const THEME_KEY = "theme_pref_v1";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { padding: spacing.md, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: c.muted, letterSpacing: 0.8, textTransform: "uppercase" },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { fontSize: 16, color: c.onSurface },
  rowSub: { fontSize: 13, color: c.muted, marginTop: 2 },
  profile: { fontSize: 15, color: c.onSurface, fontWeight: "600" },
  profileMeta: { fontSize: 13, color: c.muted, marginTop: 2 },
  note: { fontSize: 12, color: c.muted, lineHeight: 18 },
}));

export default function Settings() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const profile = useProfile();
  const syncStatus = useSyncStatus();
  const sync = useSync();
  const lessons = useUpcomingLessons();
  const tasks = useTasks();
  const study = useStudySessions(todayYmd(), parseRome(`${todayYmd()}T00:00:00`).add(30, "day").format("YYYY-MM-DD"));

  const [theme, setTheme] = useState<string>("system");
  const [notif, setNotif] = useState<NotifSettings>(DEFAULT_NOTIF_SETTINGS);

  useEffect(() => {
    storage.getItem<string>(THEME_KEY, "system").then((v) => setTheme(v ?? "system"));
    getNotifSettings().then(setNotif);
  }, []);

  const applyTheme = (val: string) => {
    setTheme(val);
    storage.setItem(THEME_KEY, val);
    setColorScheme(val === "system" ? null : (val as "light" | "dark"));
  };

  const updateNotif = async (patch: Partial<NotifSettings>) => {
    const next = { ...notif, ...patch };
    setNotif(next);
    await setNotifSettings(next);
  };

  const applyNotifications = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;
    await rescheduleAll({
      lessons: lessons.data ?? [],
      tasks: tasks.data ?? [],
      sessions: study.data ?? [],
      settings: notif,
    });
  };

  const toggle = (key: keyof NotifSettings) => (v: boolean) => updateNotif({ [key]: v } as any);

  return (
    <View style={s.root}>
      <ModalHeader title="Impostazioni" onClose={() => router.back()} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <Text style={s.sectionLabel}>Profilo</Text>
          <View style={s.card}>
            <View style={[s.rowItem, s.rowLast]}>
              <View>
                <Text style={s.profile}>{profile.data?.name}</Text>
                <Text style={s.profileMeta}>
                  {profile.data?.course_name} · {profile.data?.year_of_course}° anno
                  {profile.data?.group ? ` · ${profile.data.group}` : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Aspetto</Text>
          <Segmented
            testID="theme-toggle"
            value={theme}
            onChange={applyTheme}
            options={[
              { label: "Chiaro", value: "light" },
              { label: "Scuro", value: "dark" },
              { label: "Sistema", value: "system" },
            ]}
          />
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Notifiche</Text>
          <View style={s.card}>
            <View style={s.rowItem}>
              <Text style={s.rowText}>Lezione imminente</Text>
              <Switch value={notif.lessonReminder} onValueChange={toggle("lessonReminder")} testID="notif-lesson" />
            </View>
            <View style={s.rowItem}>
              <Text style={s.rowText}>Cambi orario / aula</Text>
              <Switch value={notif.scheduleChanges} onValueChange={toggle("scheduleChanges")} testID="notif-changes" />
            </View>
            <View style={s.rowItem}>
              <Text style={s.rowText}>Task in scadenza</Text>
              <Switch value={notif.taskDue} onValueChange={toggle("taskDue")} testID="notif-task" />
            </View>
            <View style={[s.rowItem, s.rowLast]}>
              <Text style={s.rowText}>Sessioni di studio</Text>
              <Switch value={notif.studyReminder} onValueChange={toggle("studyReminder")} testID="notif-study" />
            </View>
          </View>
          {Platform.OS !== "web" ? (
            <SecondaryButton label="Attiva e programma notifiche" onPress={applyNotifications} testID="apply-notifications" />
          ) : null}
          <Text style={s.note}>
            Le notifiche locali funzionano solo su un&apos;app installata (build reale), non
            nell&apos;anteprima Expo Go.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Dati UniBo</Text>
          <View style={s.card}>
            <View style={[s.rowItem, s.rowLast]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Ultimo aggiornamento</Text>
                <Text style={s.rowSub}>
                  {syncStatus.data?.last_success
                    ? parseRome(syncStatus.data.last_success).format("D MMM YYYY [alle] HH:mm")
                    : "Mai"}
                  {syncStatus.data ? ` · ${syncStatus.data.event_count} lezioni` : ""}
                </Text>
              </View>
            </View>
          </View>
          <SecondaryButton
            label={sync.isPending ? "Sincronizzazione…" : "Sincronizza ora"}
            onPress={() => sync.mutate()}
            testID="sync-now"
          />
        </View>
      </ScrollView>
    </View>
  );
}
