import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Modal, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius, Spacing } from "./theme";
import { useAuth } from "./lib/auth";
import { addExpenseGroup, deleteExpenseGroup, ExpenseGroup, listExpenseGroups, updateExpenseMember } from "./lib/data";
import { peso, splitLines } from "./lib/format";

export default function Expenses() {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await listExpenseGroups(user.id);
    setGroups(res.data);
    setError(res.error);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const owedToYou = groups.reduce((sum, g) => sum + (g.members ?? []).filter((m) => !m.paid && !m.is_self).reduce((s, m) => s + Number(m.amount || 0), 0), 0);
  const youOwe = groups.reduce((sum, g) => sum + (g.members ?? []).filter((m) => !m.paid && m.is_self).reduce((s, m) => s + Number(m.amount || 0), 0), 0);

  const togglePaid = async (id: string, paid: boolean) => {
    const { error } = await updateExpenseMember(id, !paid);
    if (error) Alert.alert("Could not update payment", error);
    else load();
  };

  const removeGroup = (group: ExpenseGroup) => {
    Alert.alert("Delete expense group?", group.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await deleteExpenseGroup(group.id);
          if (error) Alert.alert("Could not delete group", error);
          else load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/dashboard")} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Group Expenses</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={Colors.bg} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.summary}>
          <Summary label="Owed to you" value={owedToYou} />
          <Summary label="You owe" value={youOwe} />
        </View>

        <Text style={styles.sectionTitle}>Groups</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : error ? (
          <Empty title="Expense tables unavailable" subtitle={error} />
        ) : groups.length === 0 ? (
          <Empty title="No groups yet" subtitle="Create one with the plus button." />
        ) : (
          groups.map((g) => {
            const members = g.members ?? [];
            const unpaid = members.filter((m) => !m.paid).length;
            return (
              <View key={g.id} style={styles.groupCard}>
                <View style={styles.groupHead}>
                  <View style={styles.groupIcon}>
                    <Ionicons name="receipt-outline" size={19} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{g.name}</Text>
                    <Text style={styles.groupMeta}>PHP {Number(g.total || 0).toFixed(0)} · {members.length} people</Text>
                  </View>
                  <Text style={styles.unpaidText}>{unpaid ? `${unpaid} unpaid` : "Settled"}</Text>
                  <TouchableOpacity onPress={() => removeGroup(g)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>

                {members.map((m) => (
                  <TouchableOpacity key={m.id} style={styles.memberRow} onPress={() => togglePaid(m.id, m.paid)}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvText}>{m.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{m.name}{m.is_self ? " (You)" : ""}</Text>
                      <Text style={styles.memberAmt}>{peso(Number(m.amount || 0))}</Text>
                    </View>
                    <View style={[styles.checkBox, m.paid && styles.checkBoxOn]}>
                      {m.paid && <Ionicons name="checkmark" size={14} color={Colors.bg} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <AddGroupModal visible={showAdd} onClose={() => setShowAdd(false)} userId={user?.id} selfName={profile?.name || user?.email?.split("@")[0] || "You"} onSaved={load} />
    </SafeAreaView>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.sumCard}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumAmt}>{peso(value)}</Text>
    </View>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="file-tray-outline" size={42} color={Colors.textDim} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
    </View>
  );
}

function AddGroupModal({ visible, onClose, userId, selfName, onSaved }: { visible: boolean; onClose: () => void; userId?: string; selfName: string; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [members, setMembers] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const total = Number(amount);
    const names = splitLines(members);
    if (!userId || !name.trim() || !Number.isFinite(total) || total <= 0 || names.length === 0) {
      Alert.alert("Missing details", "Enter a group name, amount, and at least one member.");
      return;
    }
    const perPerson = total / (names.length + 1);
    setSaving(true);
    const { error } = await addExpenseGroup(
      userId,
      { name: name.trim(), total },
      [
        { name: selfName, amount: perPerson, paid: true, is_self: true },
        ...names.map((n) => ({ name: n, amount: perPerson, paid: false, is_self: false })),
      ]
    );
    setSaving(false);
    if (error) {
      Alert.alert("Could not create group", error);
      return;
    }
    setName("");
    setAmount("");
    setMembers("");
    onClose();
    onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>New Expense Group</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Field label="Group name" value={name} onChangeText={setName} placeholder="Project materials" />
          <Field label="Total amount" value={amount} onChangeText={setAmount} placeholder="500" keyboardType="numeric" />
          <Field label="Members" value={members} onChangeText={setMembers} placeholder="Maria, Pedro, Ana" />
          <TouchableOpacity onPress={save} style={styles.create} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.bg} /> : <Text style={styles.createText}>Create Group</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Field(props: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string; keyboardType?: "default" | "numeric" }) {
  return (
    <>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput style={styles.input} placeholder={props.placeholder} placeholderTextColor={Colors.textDim} value={props.value} onChangeText={props.onChangeText} keyboardType={props.keyboardType} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  header: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, gap: 12 },
  back: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  title: { flex: 1, color: Colors.text, fontSize: 20, fontWeight: "800" },
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  scroll: { padding: Spacing.lg, paddingTop: 0 },
  summary: { flexDirection: "row", gap: 10 },
  sumCard: { flex: 1, borderRadius: Radius.lg, padding: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sumLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  sumAmt: { color: Colors.text, fontSize: 22, fontWeight: "900", marginTop: 4 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: "800", marginTop: 24, marginBottom: 12 },
  groupCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  groupIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: Colors.primary + "18" },
  groupName: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  groupMeta: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  unpaidText: { color: Colors.textMuted, fontSize: 11, fontWeight: "700" },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  memberAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", backgroundColor: Colors.surfaceLight },
  memberAvText: { fontWeight: "800", fontSize: 13, color: Colors.textMuted },
  memberName: { color: Colors.text, fontSize: 13, fontWeight: "600" },
  memberAmt: { color: Colors.textMuted, fontSize: 11 },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: "center", alignItems: "center" },
  checkBoxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  deleteBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center", backgroundColor: Colors.surfaceLight },
  empty: { alignItems: "center", paddingTop: 70, gap: 8 },
  emptyTitle: { color: Colors.text, fontSize: 17, fontWeight: "700" },
  emptySub: { color: Colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.62)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, borderWidth: 1, borderColor: Colors.border },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: "800" },
  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.md, padding: 12, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  create: { backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: "center", marginTop: 20 },
  createText: { color: Colors.bg, fontWeight: "800", fontSize: 15 },
});
