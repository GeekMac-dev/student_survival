import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Colors, Radius, Spacing } from "../theme";
import { useAuth } from "../lib/auth";
import { listExpenseGroups, listReviewers, listSchedule, listTasks } from "../lib/data";

const tools = [
  { icon: "timer" as const, label: "Pomodoro Timer", route: "/tools" },
  { icon: "calculator" as const, label: "GPA Calculator", route: "/tools" },
  { icon: "wallet" as const, label: "Allowance Tracker", route: "/tools" },
  { icon: "heart" as const, label: "Mental Wellness", route: "/tools" },
  { icon: "book" as const, label: "Schedule Tools", route: "/(tabs)/schedule" },
  { icon: "scan" as const, label: "Task Scanner", route: "/(tabs)/scanner" },
];

type MenuItem = { icon: keyof typeof Ionicons.glyphMap; label: string; route?: string; action?: () => void };

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({ classes: 0, tasks: 0, groups: 0, reviewers: 0 });

  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    const [s, t, g, r] = await Promise.all([listSchedule(user.id), listTasks(user.id), listExpenseGroups(user.id), listReviewers(user.id)]);
    setStats({
      classes: s.data.length,
      tasks: t.data.length,
      groups: g.data.length,
      reviewers: r.data.length,
    });
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleLogout = () => {
    Alert.alert("Log out?", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const initials = displayName
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const school = profile?.school || "Add your school";
  const course = profile?.course || "Add your course";
  const year = profile?.year_level;

  const menuItems: MenuItem[] = useMemo(
    () => [
      { icon: "people", label: "Group Expenses", route: "/expenses" },
      { icon: "library", label: "Reviewer Marketplace", route: "/reviewers" },
      { icon: "bus", label: "Commute Calculator", route: "/commute" },
      { icon: "sparkles", label: "AI Assistant", route: "/ai" },
      {
        icon: "shield-checkmark",
        label: "Emergency Contacts",
        action: () => Linking.openURL("tel:09178998727"),
      },
      {
        icon: "help-circle",
        label: "Help & Support",
        action: () => Linking.openURL("mailto:support@sulit.app"),
      },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "S"}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email || "no email"}</Text>
          <View style={styles.uniBadge}>
            <Ionicons name="school" size={12} color={Colors.primary} />
            <Text style={styles.uniText}>
              {school} · {course}
              {year ? ` · ${year}` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat title={String(stats.classes)} label="Classes" />
          <Stat title={String(stats.tasks)} label="Tasks" withDivider />
          <Stat title={String(stats.groups + stats.reviewers)} label="Saved Items" />
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.premium} onPress={() => router.push("/ai")}>
          <View style={styles.premiumIcon}>
            <Ionicons name="sparkles" size={20} color={Colors.bg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>Open Study Assistant</Text>
            <Text style={styles.premiumSub}>Ask questions, summarize notes, build quick plans</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.bg} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Survival Tools</Text>
        <View style={styles.toolGrid}>
          {tools.map((t) => (
            <TouchableOpacity key={t.label} style={styles.toolCard} onPress={() => router.push(t.route as any)}>
              <View style={styles.toolIcon}>
                <Ionicons name={t.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.toolLabel}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Menu</Text>
        <View style={styles.menuBox}>
          {menuItems.map((m, i) => (
            <TouchableOpacity
              key={m.label}
              style={[styles.menuRow, i === menuItems.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => (m.route ? router.push(m.route as any) : m.action?.())}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={m.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Sulit v1.0.0</Text>
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ title, label, withDivider }: { title: string; label: string; withDivider?: boolean }) {
  return (
    <View style={[styles.statBox, withDivider && styles.statBoxMid]}>
      <Text style={styles.statNum}>{title}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  scroll: { padding: Spacing.lg },
  profileHead: { alignItems: "center", paddingTop: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { color: Colors.bg, fontSize: 28, fontWeight: "900" },
  name: { color: Colors.text, fontSize: 22, fontWeight: "800", marginTop: 12 },
  email: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  uniBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.surface, borderRadius: 999, borderWidth: 1, borderColor: Colors.border, maxWidth: "100%" },
  uniText: { color: Colors.text, fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", marginTop: 20, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 4 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statBoxMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  statNum: { color: Colors.text, fontSize: 20, fontWeight: "800" },
  statLbl: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  premium: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 16, marginTop: 20 },
  premiumIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surfaceLight, justifyContent: "center", alignItems: "center" },
  premiumTitle: { color: Colors.bg, fontSize: 15, fontWeight: "800" },
  premiumSub: { color: Colors.bg, fontSize: 11, marginTop: 2, opacity: 0.8 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: "800", marginTop: 28, marginBottom: 12 },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  toolCard: { width: "31%", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  toolIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: Colors.primary + "22" },
  toolLabel: { color: Colors.text, fontSize: 11, fontWeight: "600", textAlign: "center", marginTop: 8 },
  menuBox: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + "22", justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: "600" },
  logout: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, padding: 16, marginTop: 16, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  logoutText: { color: Colors.danger, fontWeight: "700" },
  version: { color: Colors.textDim, fontSize: 11, textAlign: "center", marginTop: 16 },
});
