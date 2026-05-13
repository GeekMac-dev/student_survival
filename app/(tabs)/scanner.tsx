import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../theme";
import { useAuth } from "../lib/auth";
import { addTask, listTasks, TaskItem } from "../lib/data";

export default function Scanner() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const res = await listTasks(user.id);
    setTasks(res.data);
    setError(res.error);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleScan = () => {
    setScanning(true);
    setResult("");
    setTimeout(() => {
      setScanning(false);
      setResult("Type or paste the extracted assignment text here. Connect OCR later without changing the save flow.");
    }, 700);
  };

  const saveTask = async () => {
    if (!user?.id || !result.trim()) {
      Alert.alert("No task text", "Scan or type the assignment details first.");
      return;
    }
    const title = result.trim().split(/[.\n]/)[0].slice(0, 80) || "Scanned task";
    const { error } = await addTask(user.id, {
      title,
      subject: subject.trim() || null,
      deadline: deadline.trim() || null,
      notes: result.trim(),
      done: false,
    });
    if (error) {
      Alert.alert("Could not save task", error);
      return;
    }
    setResult("");
    setSubject("");
    setDeadline("");
    load();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Assignment Scanner</Text>
        <Text style={styles.sub}>Capture a task, review the extracted text, then save it as a reminder.</Text>

        <View style={styles.camera}>
          {scanning ? (
            <>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.scanText}>Reading document...</Text>
            </>
          ) : (
            <>
              <View style={styles.scanFrame}>
                <Ionicons name="document-text-outline" size={56} color={Colors.textDim} />
              </View>
              <Text style={styles.cameraHint}>Use the scan button or paste task text below</Text>
            </>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handleScan} style={styles.shutter} disabled={scanning}>
            <Ionicons name="scan" size={24} color={Colors.bg} />
          </TouchableOpacity>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.label}>Task text</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={result}
            onChangeText={setResult}
            placeholder="Paste or edit extracted assignment details"
            placeholderTextColor={Colors.textDim}
            multiline
          />
          <Text style={styles.label}>Subject</Text>
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Optional" placeholderTextColor={Colors.textDim} />
          <Text style={styles.label}>Deadline</Text>
          <TextInput style={styles.input} value={deadline} onChangeText={setDeadline} placeholder="Optional, e.g. 2026-05-20" placeholderTextColor={Colors.textDim} />
          <TouchableOpacity onPress={saveTask} style={styles.saveBtn}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.bg} />
            <Text style={styles.saveText}>Save Reminder</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Saved Tasks</Text>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : tasks.length === 0 ? (
          <Text style={styles.empty}>No scanned tasks saved yet.</Text>
        ) : (
          tasks.map((t) => (
            <View key={t.id} style={styles.recentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recSubject}>{t.subject || "Task"}</Text>
                <Text style={styles.recTitle}>{t.title}</Text>
              </View>
              {!!t.deadline && <Text style={styles.deadlineText}>{t.deadline}</Text>}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  scroll: { padding: Spacing.lg },
  title: { color: Colors.text, fontSize: 24, fontWeight: "800" },
  sub: { color: Colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 19 },
  camera: { marginTop: 20, height: 270, borderRadius: Radius.xl, backgroundColor: "#090A09", justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  scanFrame: { width: 210, height: 190, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  cameraHint: { color: Colors.textMuted, fontSize: 12, marginTop: 16 },
  scanText: { color: Colors.text, marginTop: 14, fontWeight: "600" },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 18 },
  shutter: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  resultCard: { marginTop: 24, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border },
  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.md, padding: 12, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: Radius.md, marginTop: 14 },
  saveText: { color: Colors.bg, fontWeight: "800", fontSize: 14 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: "800", marginTop: 28, marginBottom: 12 },
  recentRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  recSubject: { color: Colors.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  recTitle: { color: Colors.text, fontSize: 14, fontWeight: "700", marginTop: 2 },
  deadlineText: { color: Colors.textMuted, fontSize: 12, fontWeight: "600" },
  empty: { color: Colors.textMuted, fontSize: 13 },
  error: { color: Colors.warning, fontSize: 13, lineHeight: 19 },
});
