import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Modal, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius, Spacing } from "./theme";
import { useAuth } from "./lib/auth";
import { addReviewer, listReviewers, ReviewerItem } from "./lib/data";

export default function Reviewers() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ReviewerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await listReviewers(user.id);
    setItems(res.data);
    setError(res.error);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((r) => !q || r.title.toLowerCase().includes(q) || (r.subject ?? "").toLowerCase().includes(q));
  }, [items, search]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Reviewers</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.uploadBtn}>
          <Ionicons name="add" size={20} color={Colors.bg} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput placeholder="Search saved reviewers" placeholderTextColor={Colors.textDim} value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>

        <Text style={styles.sectionTitle}>Saved Reviewers</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : error ? (
          <Empty title="Reviewer table unavailable" subtitle={error} />
        ) : filtered.length === 0 ? (
          <Empty title="No reviewers saved" subtitle="Upload or save your own notes with the plus button." />
        ) : (
          filtered.map((r) => (
            <View key={r.id} style={styles.revCard}>
              <View style={styles.revIcon}>
                <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.revTitle} numberOfLines={2}>{r.title}</Text>
                <Text style={styles.revAuthor}>{r.subject || "General"} · {r.author || "You"}</Text>
                <View style={styles.revMeta}>
                  {!!r.pages && <Meta icon="document-outline" text={`${r.pages}p`} />}
                  {!!r.url && <Meta icon="link-outline" text="Link saved" />}
                </View>
              </View>
              <Text style={styles.price}>{Number(r.price || 0) === 0 ? "Free" : `PHP ${Number(r.price).toFixed(0)}`}</Text>
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
      <AddReviewerModal visible={showAdd} onClose={() => setShowAdd(false)} userId={user?.id} author={profile?.name || user?.email?.split("@")[0] || "You"} onSaved={load} />
    </SafeAreaView>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.revStat}>
      <Ionicons name={icon} size={11} color={Colors.textMuted} />
      <Text style={styles.revStatText}>{text}</Text>
    </View>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="library-outline" size={42} color={Colors.textDim} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
    </View>
  );
}

function AddReviewerModal({ visible, onClose, userId, author, onSaved }: { visible: boolean; onClose: () => void; userId?: string; author: string; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [price, setPrice] = useState("0");
  const [pages, setPages] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amount = Number(price || 0);
    if (!userId || !title.trim() || !Number.isFinite(amount)) {
      Alert.alert("Missing details", "Title and valid price are required.");
      return;
    }
    setSaving(true);
    const { error } = await addReviewer(userId, {
      title: title.trim(),
      subject: subject.trim() || null,
      author,
      price: amount,
      pages: pages ? Number(pages) : null,
      url: url.trim() || null,
    });
    setSaving(false);
    if (error) {
      Alert.alert("Could not save reviewer", error);
      return;
    }
    setTitle("");
    setSubject("");
    setPrice("0");
    setPages("");
    setUrl("");
    onClose();
    onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Add Reviewer</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.text} /></TouchableOpacity>
          </View>
          <Field label="Title" value={title} onChangeText={setTitle} placeholder="Calculus reviewer" />
          <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="Math" />
          <Field label="Price" value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" />
          <Field label="Pages" value={pages} onChangeText={setPages} placeholder="Optional" keyboardType="numeric" />
          <Field label="File/link URL" value={url} onChangeText={setUrl} placeholder="Optional" />
          <TouchableOpacity onPress={save} style={styles.create} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.bg} /> : <Text style={styles.createText}>Save Reviewer</Text>}
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
  title: { flex: 1, color: Colors.text, fontSize: 18, fontWeight: "800" },
  uploadBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  scroll: { padding: Spacing.lg, paddingTop: 0 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 12 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: "800", marginTop: 24, marginBottom: 12 },
  revCard: { flexDirection: "row", gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  revIcon: { width: 54, height: 54, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: Colors.primary + "18" },
  revTitle: { color: Colors.text, fontSize: 14, fontWeight: "800" },
  revAuthor: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  revMeta: { flexDirection: "row", gap: 10, marginTop: 6 },
  revStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  revStatText: { color: Colors.textMuted, fontSize: 11 },
  price: { color: Colors.text, fontSize: 13, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 70, gap: 8 },
  emptyTitle: { color: Colors.text, fontSize: 17, fontWeight: "700" },
  emptySub: { color: Colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.62)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, borderWidth: 1, borderColor: Colors.border },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: "800" },
  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.md, padding: 12, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  create: { backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: "center", marginTop: 18 },
  createText: { color: Colors.bg, fontWeight: "800", fontSize: 15 },
});
