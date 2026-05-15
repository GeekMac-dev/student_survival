import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius, Spacing } from "./theme";
import { useAuth } from "./lib/auth";
import {
  addWellnessLog,
  AllowanceData,
  GpaSubject,
  getUserSettings,
  listWellnessLogs,
  saveUserSettings,
  WellnessLog,
} from "./lib/data";

const tabs = ["Pomodoro", "GPA", "Allowance", "Wellness"];

export default function Tools() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Survival Tools</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.lg }}
      >
        {tabs.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => setTab(i)} style={[styles.tab, tab === i && styles.tabActive]}>
            <Text style={[styles.tabText, tab === i && { color: Colors.bg }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {tab === 0 && <Pomodoro />}
        {tab === 1 && <GPA userId={user?.id} />}
        {tab === 2 && <Allowance userId={user?.id} />}
        {tab === 3 && <Wellness userId={user?.id} />}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Pomodoro ──────────────────────────────────────────────────

function Pomodoro() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [session, setSession] = useState(1);
  const [completed, setCompleted] = useState(0);
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (running && secs > 0) {
      ref.current = setTimeout(() => setSecs((s) => s - 1), 1000);
    } else if (running && secs === 0) {
      if (onBreak) {
        setOnBreak(false);
        setRunning(false);
        setSecs(focusMinutes * 60);
        Alert.alert("Break finished", "Back to focus mode.");
      } else {
        setRunning(false);
        setCompleted((c) => c + 1);
        setSession((s) => s + 1);
        setOnBreak(true);
        setSecs(breakMinutes * 60);
        Alert.alert("Focus session done!", `Start your ${breakMinutes}-minute break.`);
      }
    }
    return () => { if (ref.current) clearTimeout(ref.current); };
  }, [running, secs, onBreak, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (!running) setSecs((onBreak ? breakMinutes : focusMinutes) * 60);
  }, [focusMinutes, breakMinutes, onBreak, running]);

  const min = Math.floor(secs / 60).toString().padStart(2, "0");
  const sec = (secs % 60).toString().padStart(2, "0");

  return (
    <View>
      <View style={styles.timerBox}>
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>{min}:{sec}</Text>
          <Text style={styles.timerLabel}>{onBreak ? "Break Mode" : "Focus Mode"}</Text>
        </View>
        <Text style={styles.sessionText}>Session #{session}</Text>
      </View>
      <View style={styles.timerControls}>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={() => { setRunning(false); setSecs((onBreak ? breakMinutes : focusMinutes) * 60); }}
        >
          <Ionicons name="refresh" size={20} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: running ? Colors.danger : Colors.primary }]}
          onPress={() => setRunning((r) => !r)}
        >
          <Ionicons name={running ? "pause" : "play"} size={26} color={Colors.bg} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => setOnBreak((v) => !v)}>
          <Ionicons name="swap-horizontal" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.timeConfigRow}>
        <TimeInput label="Focus (min)" value={focusMinutes} setValue={setFocusMinutes} />
        <TimeInput label="Break (min)" value={breakMinutes} setValue={setBreakMinutes} />
      </View>
      <View style={styles.pomoStats}>
        <View style={styles.pStat}>
          <Text style={styles.pStatNum}>{completed}</Text>
          <Text style={styles.pStatLbl}>Completed</Text>
        </View>
        <View style={styles.pStat}>
          <Text style={styles.pStatNum}>{focusMinutes}</Text>
          <Text style={styles.pStatLbl}>Focus min</Text>
        </View>
        <View style={styles.pStat}>
          <Text style={styles.pStatNum}>{breakMinutes}</Text>
          <Text style={styles.pStatLbl}>Break min</Text>
        </View>
      </View>
    </View>
  );
}

function TimeInput({ label, value, setValue }: { label: string; value: number; setValue: (n: number) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.gpaInput}
        value={String(value)}
        keyboardType="numeric"
        onChangeText={(v) => setValue(Math.max(1, Math.min(120, parseInt(v || "0", 10) || 1)))}
      />
    </View>
  );
}

// ── GPA ───────────────────────────────────────────────────────

const DEFAULT_SUBJECTS: GpaSubject[] = [{ name: "", units: 3, grade: 1.75 }];

function GPA({ userId }: { userId?: string }) {
  const [subjects, setSubjects] = useState<GpaSubject[]>(DEFAULT_SUBJECTS);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;
    getUserSettings(userId).then(({ data }) => {
      if (data?.gpa_subjects?.length) setSubjects(data.gpa_subjects);
      setLoaded(true);
    });
  }, [userId]);

  const updateSubjects = (next: GpaSubject[]) => {
    setSubjects(next);
    if (!userId || !loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveUserSettings(userId, { gpa_subjects: next });
    }, 800);
  };

  const total = subjects.reduce((s, x) => s + x.units, 0);
  const weighted = subjects.reduce((s, x) => s + x.grade * x.units, 0);
  const gpa = total > 0 ? (weighted / total).toFixed(2) : "0.00";

  const gpaColor =
    parseFloat(gpa) <= 1.5 ? "#34D399" :
    parseFloat(gpa) <= 2.5 ? Colors.text :
    parseFloat(gpa) <= 3.0 ? Colors.warning :
    Colors.danger;

  return (
    <View>
      <View style={styles.gpaBox}>
        <Text style={styles.gpaLabel}>CURRENT GPA</Text>
        <Text style={[styles.gpaNum, { color: gpaColor }]}>{gpa}</Text>
        <Text style={styles.gpaSub}>{total} total units</Text>
      </View>
      {subjects.map((s, i) => (
        <View key={i} style={styles.gpaRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            value={s.name}
            onChangeText={(v) => {
              const next = subjects.map((x, idx) => idx === i ? { ...x, name: v } : x);
              updateSubjects(next);
            }}
            placeholder={`Subject ${i + 1}`}
            placeholderTextColor={Colors.textDim}
          />
          <TextInput
            style={[styles.gpaInput, { width: 52 }]}
            value={String(s.units)}
            keyboardType="numeric"
            onChangeText={(v) => {
              const next = subjects.map((x, idx) =>
                idx === i ? { ...x, units: Math.max(1, parseInt(v || "0", 10) || 1) } : x
              );
              updateSubjects(next);
            }}
          />
          <TextInput
            style={[styles.gpaInput, { width: 60, marginLeft: 6 }]}
            value={String(s.grade)}
            keyboardType="numeric"
            onChangeText={(v) => {
              const parsed = parseFloat(v) || 0;
              const next = subjects.map((x, idx) =>
                idx === i ? { ...x, grade: Math.max(1.0, Math.min(5.0, parsed)) } : x
              );
              updateSubjects(next);
            }}
          />
          <TouchableOpacity
            onPress={() => updateSubjects(subjects.filter((_, idx) => idx !== i))}
            style={styles.removeBtn}
            disabled={subjects.length === 1}
          >
            <Ionicons name="close" size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
      ))}
      <Text style={styles.gpaHint}>Units · Grade (1.0–5.0)</Text>
      <TouchableOpacity
        style={styles.addRowBtn}
        onPress={() => updateSubjects([...subjects, { name: "", units: 3, grade: 1.75 }])}
      >
        <Ionicons name="add" size={16} color={Colors.bg} />
        <Text style={styles.addRowText}>Add Subject</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Allowance ─────────────────────────────────────────────────

const DEFAULT_ALLOWANCE: AllowanceData = { weekly: "1500", food: "0", transpo: "0", school: "0", other: "0" };

function Allowance({ userId }: { userId?: string }) {
  const [data, setData] = useState<AllowanceData>(DEFAULT_ALLOWANCE);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;
    getUserSettings(userId).then(({ data: settings }) => {
      if (settings?.allowance_data?.weekly) setData(settings.allowance_data);
      setLoaded(true);
    });
  }, [userId]);

  const update = (field: keyof AllowanceData, value: string) => {
    const next = { ...data, [field]: value };
    setData(next);
    if (!userId || !loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveUserSettings(userId, { allowance_data: next });
    }, 800);
  };

  const weeklyN = Number(data.weekly) || 0;
  const expenses = useMemo(
    () => [
      { cat: "Food" as const, key: "food" as const, icon: "restaurant" as const },
      { cat: "Transpo" as const, key: "transpo" as const, icon: "bus" as const },
      { cat: "School" as const, key: "school" as const, icon: "book" as const },
      { cat: "Others" as const, key: "other" as const, icon: "cart" as const },
    ],
    []
  );
  const spent = expenses.reduce((s, e) => s + (Number(data[e.key]) || 0), 0);
  const left = weeklyN - spent;
  const pct = weeklyN > 0 ? Math.min(100, (spent / weeklyN) * 100) : 0;
  const overBudget = left < 0;

  return (
    <View>
      <View style={styles.allowBox}>
        <Text style={styles.allowLabel}>REMAINING THIS WEEK</Text>
        <Text style={[styles.allowAmt, overBudget && { color: Colors.danger }]}>
          PHP {Math.abs(left).toFixed(0)}{overBudget ? " over" : ""}
        </Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: overBudget ? Colors.danger : Colors.primary }]} />
        </View>
        <Text style={styles.allowSub}>PHP {spent.toFixed(0)} spent of PHP {weeklyN.toFixed(0)}</Text>
      </View>
      <Text style={styles.inputLabel}>Weekly budget (PHP)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={data.weekly}
        onChangeText={(v) => update("weekly", v)}
        placeholder="1500"
        placeholderTextColor={Colors.textDim}
      />
      <Text style={styles.toolSection}>Breakdown</Text>
      {expenses.map((e) => (
        <View key={e.cat} style={styles.expRow}>
          <View style={styles.expIcon}>
            <Ionicons name={e.icon} size={18} color={Colors.primary} />
          </View>
          <Text style={styles.expCat}>{e.cat}</Text>
          <TextInput
            style={[styles.gpaInput, { width: 96 }]}
            keyboardType="numeric"
            value={data[e.key]}
            onChangeText={(v) => update(e.key, v)}
          />
        </View>
      ))}
    </View>
  );
}

// ── Wellness ──────────────────────────────────────────────────

const MOODS = [
  { emoji: "🙂", label: "Okay" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😟", label: "Stressed" },
  { emoji: "😔", label: "Low" },
];

const SUPPORT_LINKS = [
  { name: "Hopeline PH", num: "0917-558-4673" },
  { name: "NCMH Crisis Line", num: "0917-899-8727" },
];

function Wellness({ userId }: { userId?: string }) {
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<WellnessLog[]>([]);

  const loadLogs = useCallback(async () => {
    if (!userId) return;
    const { data } = await listWellnessLogs(userId);
    setLogs(data);
  }, [userId]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const saveCheckin = async () => {
    if (mood === null) {
      Alert.alert("Select a mood", "Tap how you're feeling before saving.");
      return;
    }
    if (!userId) {
      Alert.alert("Not signed in", "Sign in to save your check-in.");
      return;
    }
    setSaving(true);
    const { error } = await addWellnessLog(userId, mood, note);
    setSaving(false);
    if (error) {
      Alert.alert("Could not save check-in", error);
      return;
    }
    setMood(null);
    setNote("");
    loadLogs();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View>
      <Text style={styles.toolSection}>How are you feeling today?</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m, i) => (
          <TouchableOpacity key={m.label} onPress={() => setMood(i)} style={[styles.moodBtn, mood === i && styles.moodBtnOn]}>
            <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
            <Text style={[styles.moodLbl, mood === i && { color: Colors.bg }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.inputLabel}>Journal note (optional)</Text>
      <TextInput
        style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
        multiline
        value={note}
        onChangeText={setNote}
        placeholder="Write how your day went…"
        placeholderTextColor={Colors.textDim}
      />
      <TouchableOpacity style={[styles.addRowBtn, saving && { opacity: 0.6 }]} onPress={saveCheckin} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={Colors.bg} size="small" />
        ) : (
          <>
            <Ionicons name="save-outline" size={16} color={Colors.bg} />
            <Text style={styles.addRowText}>Save Check-in</Text>
          </>
        )}
      </TouchableOpacity>

      {logs.length > 0 && (
        <>
          <Text style={styles.toolSection}>Recent Check-ins</Text>
          {logs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Text style={styles.logEmoji}>{MOODS[log.mood]?.emoji ?? "?"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.logMood}>{MOODS[log.mood]?.label ?? "Unknown"}</Text>
                {!!log.note && <Text style={styles.logNote}>{log.note}</Text>}
              </View>
              <Text style={styles.logDate}>{formatDate(log.created_at)}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={styles.toolSection}>Support Contacts</Text>
      {SUPPORT_LINKS.map((c) => (
        <TouchableOpacity key={c.name} style={styles.contactRow} onPress={() => Linking.openURL(`tel:${c.num}`)}>
          <Ionicons name="call" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactName}>{c.name}</Text>
            <Text style={styles.contactNum}>{c.num}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  header: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, gap: 12 },
  back: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { flex: 1, color: Colors.text, fontSize: 20, fontWeight: "800" },
  tabBar: { maxHeight: 50 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: "700" },
  scroll: { padding: Spacing.lg },
  // Pomodoro
  timerBox: { alignItems: "center", marginTop: 20 },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 8,
    borderColor: Colors.primary,
  },
  timerText: { color: Colors.text, fontSize: 50, fontWeight: "900" },
  timerLabel: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  sessionText: { color: Colors.textMuted, marginTop: 16, fontSize: 13 },
  timerControls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 24, marginTop: 24 },
  ctrlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bigBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  timeConfigRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  pomoStats: {
    flexDirection: "row",
    marginTop: 18,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pStat: { flex: 1, alignItems: "center", paddingVertical: 14 },
  pStatNum: { color: Colors.text, fontSize: 20, fontWeight: "800" },
  pStatLbl: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  // GPA
  gpaBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpaLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  gpaNum: { fontSize: 48, fontWeight: "900", marginVertical: 4 },
  gpaSub: { color: Colors.textMuted, fontSize: 12 },
  gpaHint: { color: Colors.textDim, fontSize: 11, textAlign: "right", marginBottom: 4, marginTop: -2 },
  gpaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpaInput: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.text,
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addRowBtn: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  addRowText: { color: Colors.bg, fontWeight: "800", fontSize: 13 },
  // Allowance
  allowBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  allowLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  allowAmt: { color: Colors.text, fontSize: 32, fontWeight: "900", marginTop: 4 },
  bar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barFill: { height: "100%", borderRadius: 4 },
  allowSub: { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
  toolSection: { color: Colors.text, fontSize: 16, fontWeight: "800", marginTop: 16, marginBottom: 12 },
  expRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary + "22",
  },
  expCat: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: "600" },
  // Wellness
  moodRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodBtnOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  moodLbl: { color: Colors.textMuted, fontSize: 10, fontWeight: "600", marginTop: 4 },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logEmoji: { fontSize: 22, marginTop: 2 },
  logMood: { color: Colors.text, fontSize: 13, fontWeight: "700" },
  logNote: { color: Colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  logDate: { color: Colors.textDim, fontSize: 10, marginTop: 2 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: Radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactName: { color: Colors.text, fontSize: 14, fontWeight: "700" },
  contactNum: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
  // Shared
  inputLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.md,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
