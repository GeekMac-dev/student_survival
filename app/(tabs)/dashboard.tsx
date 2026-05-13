import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Colors, Radius, Spacing } from "../theme";
import { QuickActionCard, StatCard, SectionHeader } from "../components/Card";
import { useAuth } from "../lib/auth";
import { ExpenseGroup, listExpenseGroups, listSchedule, listTasks, ScheduleItem, TaskItem } from "../lib/data";

const actionColor = Colors.primary;

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState<ScheduleItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [scheduleRes, taskRes, expenseRes] = await Promise.all([listSchedule(user.id), listTasks(user.id), listExpenseGroups(user.id)]);
    setClasses(scheduleRes.data);
    setTasks(taskRes.data);
    setGroups(expenseRes.data);
    setError(scheduleRes.error || taskRes.error || expenseRes.error);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const today = new Date();
  const dayIndex = today.getDay() === 0 ? -1 : today.getDay() - 1;
  const todayClasses = useMemo(() => classes.filter((c) => c.day === dayIndex).sort((a, b) => a.start_time.localeCompare(b.start_time)), [classes, dayIndex]);
  const nextClass = todayClasses[0];
  const openTasks = tasks.filter((t) => !t.done).length;
  const owedToYou = groups.reduce((sum, g) => sum + (g.members ?? []).filter((m) => !m.paid && !m.is_self).reduce((s, m) => s + Number(m.amount || 0), 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hi}>Hi, {profile?.name || user?.email?.split("@")[0] || "Student"}</Text>
            <Text style={styles.day}>{today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</Text>
          </View>
          <TouchableOpacity style={styles.bell}>
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 28 }} />
        ) : error ? (
          <View style={styles.notice}>
            <Ionicons name="server-outline" size={18} color={Colors.warning} />
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : (
          <>
            <SectionHeader title="Next Class" action="View all" onAction={() => router.push("/(tabs)/schedule")} />
            {nextClass ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/(tabs)/schedule")} style={styles.nextCard}>
                <View style={styles.nextHead}>
                  <View>
                    <Text style={styles.nextName}>{nextClass.name}</Text>
                    {!!nextClass.professor && <Text style={styles.nextProf}>{nextClass.professor}</Text>}
                  </View>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{nextClass.start_time}</Text>
                  </View>
                </View>
                <View style={styles.nextMeta}>
                  {!!nextClass.room && <Meta icon="location-outline" text={nextClass.room} />}
                  <Meta icon="time-outline" text={`${nextClass.start_time} - ${nextClass.end_time}`} />
                </View>
              </TouchableOpacity>
            ) : (
              <EmptyPanel text="No class saved for today." action="Add schedule" onPress={() => router.push("/(tabs)/schedule")} />
            )}

            <SectionHeader title="Quick Actions" />
            <View style={styles.grid}>
              <QuickActionCard title="Scan Task" subtitle="Save reminders" icon="scan" color={actionColor} onPress={() => router.push("/(tabs)/scanner")} />
              <QuickActionCard title="Split Bill" subtitle="Track payments" icon="cash-outline" color={actionColor} onPress={() => router.push("/expenses")} />
              <QuickActionCard title="Food" subtitle="Saved cheap eats" icon="restaurant-outline" color={actionColor} onPress={() => router.push("/(tabs)/food")} />
              <QuickActionCard title="Ask AI" subtitle="Study assistant" icon="sparkles-outline" color={actionColor} onPress={() => router.push("/ai")} />
              <QuickActionCard title="Commute" subtitle="Fare estimate" icon="bus-outline" color={actionColor} onPress={() => router.push("/commute")} />
              <QuickActionCard title="Reviewers" subtitle="Your notes" icon="library-outline" color={actionColor} onPress={() => router.push("/reviewers")} />
            </View>

            <SectionHeader title="Current Snapshot" />
            <View style={styles.grid}>
              <StatCard label="Classes today" value={`${todayClasses.length}`} icon="calendar" color={Colors.primary} />
              <StatCard label="Open tasks" value={`${openTasks}`} icon="list" color={Colors.primary} />
              <StatCard label="Owed to you" value={`PHP ${owedToYou.toFixed(0)}`} icon="wallet" color={Colors.primary} />
              <StatCard label="Groups" value={`${groups.length}`} icon="people" color={Colors.primary} />
            </View>

            <SectionHeader title="Today's Schedule" />
            {todayClasses.length === 0 ? (
              <EmptyPanel text="Your saved schedule will appear here." action="Add class" onPress={() => router.push("/(tabs)/schedule")} />
            ) : (
              <View style={styles.todayBox}>
                {todayClasses.map((c, i) => (
                  <View key={c.id} style={[styles.todayRow, i === todayClasses.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.todayTime}>{c.start_time}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.todayName}>{c.name}</Text>
                      <Text style={styles.todayRoom}>{c.room || "No room"}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={Colors.textMuted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function EmptyPanel({ text, action, onPress }: { text: string; action: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.emptyPanel} onPress={onPress}>
      <Text style={styles.emptyText}>{text}</Text>
      <Text style={styles.emptyAction}>{action}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hi: { color: Colors.text, fontSize: 22, fontWeight: "800" },
  day: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  notice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 14, marginTop: 20 },
  noticeText: { flex: 1, color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  nextCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border },
  nextHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  nextName: { color: Colors.text, fontSize: 16, fontWeight: "800" },
  nextProf: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  timeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  timeText: { color: Colors.primary, fontSize: 12, fontWeight: "700" },
  nextMeta: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: Colors.textMuted, fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  todayBox: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  todayRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  todayTime: { color: Colors.textMuted, fontSize: 13, fontWeight: "600", width: 54 },
  todayName: { color: Colors.text, fontSize: 14, fontWeight: "700" },
  todayRoom: { color: Colors.textDim, fontSize: 12, marginTop: 1 },
  emptyPanel: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 16 },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  emptyAction: { color: Colors.primary, fontSize: 13, fontWeight: "800", marginTop: 8 },
});
