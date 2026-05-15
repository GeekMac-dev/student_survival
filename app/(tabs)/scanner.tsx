import React, { useCallback, useEffect, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../theme";
import { useAuth } from "../lib/auth";
import { addTask, deleteTask, listTasks, TaskItem, updateTaskDone } from "../lib/data";
import { extractDeadline, titleFromText } from "../lib/format";

export default function Scanner() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const res = await listTasks(user.id);
    setTasks(res.data);
    setError(res.error);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onTextChange = (v: string) => {
    setText(v);
    if (!deadline.trim()) {
      const detected = extractDeadline(v);
      if (detected) setDeadline(detected);
    }
  };

  const saveTask = async () => {
    if (!user?.id || !text.trim()) {
      Alert.alert("No task text", "Paste or type the assignment details first.");
      return;
    }
    setSaving(true);
    const title = titleFromText(text);
    const { error: saveError } = await addTask(user.id, {
      title,
      subject: subject.trim() || null,
      deadline: deadline.trim() || null,
      notes: text.trim(),
      done: false,
    });
    setSaving(false);
    if (saveError) {
      Alert.alert("Could not save task", saveError);
      return;
    }
    setText("");
    setSubject("");
    setDeadline("");
    load();
  };

  const toggleDone = async (task: TaskItem) => {
    const { error: toggleError } = await updateTaskDone(task.id, !task.done);
    if (toggleError) Alert.alert("Could not update task", toggleError);
    else load();
  };

  const removeTask = (task: TaskItem) => {
    Alert.alert("Delete task?", task.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error: delError } = await deleteTask(task.id);
          if (delError) Alert.alert("Could not delete task", delError);
          else load();
        },
      },
    ]);
  };

  const pendingCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Task Capture</Text>
        <Text style={styles.sub}>Paste assignment text from your LMS, group chat, or notes app.</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{pendingCount}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{doneCount}</Text>
            <Text style={styles.statLbl}>Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{tasks.length}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>New Task</Text>
          </View>

          <Text style={styles.label}>Assignment details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={text}
            onChangeText={onTextChange}
            placeholder="Paste or type the full assignment description here. Deadline dates are auto-detected."
            placeholderTextColor={Colors.textDim}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g. Math 101"
                placeholderTextColor={Colors.textDim}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Deadline</Text>
              <TextInput
                style={styles.input}
                value={deadline}
                onChangeText={setDeadline}
                placeholder="2026-05-20"
                placeholderTextColor={Colors.textDim}
              />
            </View>
          </View>

          <TouchableOpacity onPress={saveTask} style={[styles.saveBtn, saving && { opacity: 0.7 }]} disabled={saving || !text.trim()}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.bg} />
            <Text style={styles.saveText}>{saving ? "Saving…" : "Save Task"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsRow}>
          {[
            { icon: "logo-whatsapp" as const, label: "Group chat" },
            { icon: "globe-outline" as const, label: "LMS / Portal" },
            { icon: "camera-outline" as const, label: "Photo OCR" },
            { icon: "document-text-outline" as const, label: "Syllabus" },
          ].map((tip) => (
            <View key={tip.label} style={styles.tip}>
              <Ionicons name={tip.icon} size={16} color={Colors.textMuted} />
              <Text style={styles.tipLabel}>{tip.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Saved Tasks</Text>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : tasks.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={40} color={Colors.textDim} />
            <Text style={styles.emptyText}>No tasks yet. Paste an assignment above to get started.</Text>
          </View>
        ) : (
          tasks.map((t) => (
            <TouchableOpacity key={t.id} style={styles.taskRow} onPress={() => toggleDone(t)} activeOpacity={0.75}>
              <View style={[styles.check, t.done && styles.checkDone]}>
                {t.done && <Ionicons name="checkmark" size={13} color={Colors.bg} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskSubject}>{t.subject || "Task"}</Text>
                <Text style={[styles.taskTitle, t.done && styles.taskDone]}>{t.title}</Text>
              </View>
              {!!t.deadline && (
                <View style={styles.deadlineBadge}>
                  <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                  <Text style={styles.deadlineText}>{t.deadline}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => removeTask(t)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
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
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statNum: { color: Colors.text, fontSize: 22, fontWeight: "900" },
  statLbl: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },
  card: {
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary + "1A",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { color: Colors.text, fontSize: 16, fontWeight: "800" },
  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.md,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Radius.md,
    marginTop: 16,
  },
  saveText: { color: Colors.bg, fontWeight: "800", fontSize: 14 },
  tipsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  tip: { alignItems: "center", gap: 4 },
  tipLabel: { color: Colors.textDim, fontSize: 10, fontWeight: "600" },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: "800", marginTop: 28, marginBottom: 12 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  taskSubject: { color: Colors.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  taskTitle: { color: Colors.text, fontSize: 14, fontWeight: "700", marginTop: 2 },
  taskDone: { color: Colors.textDim, textDecorationLine: "line-through" },
  deadlineBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  deadlineText: { color: Colors.textMuted, fontSize: 11, fontWeight: "600" },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
  },
  empty: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 19, maxWidth: 260 },
  errorText: { color: Colors.warning, fontSize: 13, lineHeight: 19 },
});
