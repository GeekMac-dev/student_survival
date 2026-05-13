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
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../theme";
import { useAuth } from "../lib/auth";
import { addSchedule, listSchedule, ScheduleItem } from "../lib/data";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Schedule() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 0 : Math.min(new Date().getDay() - 1, 5));
  const [classes, setClasses] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await listSchedule(user.id);
    setClasses(res.data);
    setError(res.error);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const dayClasses = classes.filter((c) => c.day === selectedDay).sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={Colors.bg} />
        </TouchableOpacity>
      </View>

      <View style={styles.days}>
        {days.map((d, i) => (
          <TouchableOpacity key={d} onPress={() => setSelectedDay(i)} style={[styles.dayBtn, selectedDay === i && styles.dayBtnActive]}>
            <Text style={[styles.dayLabel, selectedDay === i && styles.dayTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : error ? (
          <Empty icon="server-outline" title="Schedule table unavailable" subtitle={error} />
        ) : dayClasses.length === 0 ? (
          <Empty icon="calendar-clear-outline" title="No classes saved" subtitle="Add your first class with the plus button." />
        ) : (
          dayClasses.map((c) => (
            <View key={c.id} style={styles.row}>
              <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{c.start_time}</Text>
                <View style={styles.line} />
                <Text style={styles.timeEnd}>{c.end_time}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardName}>{c.name}</Text>
                {!!c.professor && <Meta icon="person-outline" text={c.professor} />}
                {!!c.room && <Meta icon="location-outline" text={c.room} />}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AddClassModal visible={showAdd} onClose={() => setShowAdd(false)} userId={user?.id} selectedDay={selectedDay} onSaved={load} />
    </SafeAreaView>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.cardMeta}>
      <Ionicons name={icon} size={13} color={Colors.textMuted} />
      <Text style={styles.cardText}>{text}</Text>
    </View>
  );
}

function Empty({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={42} color={Colors.textDim} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
    </View>
  );
}

function AddClassModal({
  visible,
  onClose,
  userId,
  selectedDay,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  selectedDay: number;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [professor, setProfessor] = useState("");
  const [room, setRoom] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [day, setDay] = useState(selectedDay);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDay(selectedDay), [selectedDay]);

  const save = async () => {
    if (!userId || !name.trim() || !start.trim() || !end.trim()) {
      Alert.alert("Missing details", "Class name, start time, and end time are required.");
      return;
    }
    setSaving(true);
    const { error } = await addSchedule(userId, {
      day,
      name: name.trim(),
      professor: professor.trim() || null,
      room: room.trim() || null,
      start_time: start.trim(),
      end_time: end.trim(),
    });
    setSaving(false);
    if (error) {
      Alert.alert("Could not save class", error);
      return;
    }
    setName("");
    setProfessor("");
    setRoom("");
    setStart("");
    setEnd("");
    onClose();
    onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Add Class</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalDays}>
            {days.map((d, i) => (
              <TouchableOpacity key={d} onPress={() => setDay(i)} style={[styles.modalDay, day === i && styles.dayBtnActive]}>
                <Text style={[styles.dayLabel, day === i && styles.dayTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Field label="Class name" value={name} onChangeText={setName} placeholder="e.g. Data Structures" />
          <View style={styles.timeInputs}>
            <Field label="Start" value={start} onChangeText={setStart} placeholder="10:30" compact />
            <Field label="End" value={end} onChangeText={setEnd} placeholder="12:00" compact />
          </View>
          <Field label="Professor" value={professor} onChangeText={setProfessor} placeholder="Optional" />
          <Field label="Room" value={room} onChangeText={setRoom} placeholder="Optional" />
          <TouchableOpacity onPress={save} style={styles.create} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.bg} /> : <Text style={styles.createText}>Save Class</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Field(props: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string; compact?: boolean }) {
  return (
    <View style={props.compact && { flex: 1 }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput style={styles.input} placeholder={props.placeholder} placeholderTextColor={Colors.textDim} value={props.value} onChangeText={props.onChangeText} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.lg, paddingBottom: 8 },
  title: { color: Colors.text, fontSize: 24, fontWeight: "800" },
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  days: { flexDirection: "row", paddingHorizontal: Spacing.lg, gap: 6, paddingBottom: 12 },
  dayBtn: { flex: 1, paddingVertical: 10, backgroundColor: Colors.surface, borderRadius: Radius.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  dayBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: "700" },
  dayTextActive: { color: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: 8 },
  row: { flexDirection: "row", marginBottom: 14, gap: 12 },
  timeCol: { alignItems: "center", width: 54 },
  timeStart: { color: Colors.text, fontSize: 12, fontWeight: "700" },
  timeEnd: { color: Colors.textMuted, fontSize: 11 },
  line: { width: 2, flex: 1, minHeight: 50, marginVertical: 4, borderRadius: 1, backgroundColor: Colors.border },
  card: { flex: 1, borderRadius: Radius.lg, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  cardName: { color: Colors.text, fontSize: 16, fontWeight: "800", marginBottom: 6 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  cardText: { color: Colors.textMuted, fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptySub: { color: Colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.62)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, borderWidth: 1, borderColor: Colors.border },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: "800" },
  modalDays: { flexDirection: "row", gap: 6, marginBottom: 8 },
  modalDay: { flex: 1, paddingVertical: 8, borderRadius: Radius.md, alignItems: "center", backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  timeInputs: { flexDirection: "row", gap: 10 },
  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.md, padding: 12, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  create: { backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: "center", marginTop: 18 },
  createText: { color: Colors.bg, fontWeight: "800", fontSize: 15 },
});
