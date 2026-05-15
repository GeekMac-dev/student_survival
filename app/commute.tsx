import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius, Spacing } from "./theme";

const modes = [
  { id: "jeep", label: "Jeep", base: 13 },
  { id: "bus", label: "Bus", base: 15 },
  { id: "train", label: "Train", base: 25 },
  { id: "ride", label: "Ride hail", base: 90 },
  { id: "walk", label: "Walk", base: 0 },
];

export default function Commute() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({ jeep: true });
  const [trips, setTrips] = useState("10");

  const selectedModes = modes.filter((m) => selected[m.id]);
  const oneWay = useMemo(() => selectedModes.reduce((sum, m) => sum + m.base, 0), [selectedModes]);
  const weekly = oneWay * (Number(trips) || 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/dashboard")} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Commute Calculator</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inputCard}>
          <Field icon="radio-button-on" value={from} onChangeText={setFrom} placeholder="From" />
          <View style={styles.divider} />
          <Field icon="location" value={to} onChangeText={setTo} placeholder="To" />
        </View>

        <Text style={styles.sectionTitle}>Route legs</Text>
        <View style={styles.modeGrid}>
          {modes.map((m) => {
            const active = !!selected[m.id];
            return (
              <TouchableOpacity key={m.id} onPress={() => setSelected((prev) => ({ ...prev, [m.id]: !prev[m.id] }))} style={[styles.mode, active && styles.modeActive]}>
                <Text style={[styles.modeLabel, active && { color: Colors.bg }]}>{m.label}</Text>
                <Text style={[styles.modeFare, active && { color: Colors.bg }]}>PHP {m.base}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Weekly trips</Text>
        <TextInput style={styles.tripsInput} value={trips} onChangeText={setTrips} keyboardType="numeric" placeholder="10" placeholderTextColor={Colors.textDim} />

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Estimated one-way fare</Text>
          <Text style={styles.total}>PHP {oneWay.toFixed(0)}</Text>
          <Text style={styles.totalSub}>{from || "Origin"} to {to || "destination"}</Text>
          <View style={styles.totalDivider} />
          <Text style={styles.totalLabel}>Weekly estimate</Text>
          <Text style={styles.weekly}>PHP {weekly.toFixed(0)}</Text>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ icon, value, onChangeText, placeholder }: { icon: keyof typeof Ionicons.glyphMap; value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.inputRow}>
      <View style={styles.iconDot}>
        <Ionicons name={icon} size={18} color={Colors.textMuted} />
      </View>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.textDim} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  header: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, gap: 12 },
  back: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  title: { flex: 1, color: Colors.text, fontSize: 20, fontWeight: "800" },
  scroll: { padding: Spacing.lg, paddingTop: 0 },
  inputCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 4 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10 },
  iconDot: { width: 32, alignItems: "center" },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 14 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 42 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: "800", marginTop: 22, marginBottom: 10 },
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mode: { width: "48%", backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  modeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeLabel: { color: Colors.text, fontSize: 14, fontWeight: "800" },
  modeFare: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  tripsInput: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 14, color: Colors.text },
  totalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 18, marginTop: 18 },
  totalLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  total: { color: Colors.text, fontSize: 34, fontWeight: "900", marginTop: 4 },
  totalSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  totalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  weekly: { color: Colors.text, fontSize: 24, fontWeight: "900", marginTop: 4 },
});
