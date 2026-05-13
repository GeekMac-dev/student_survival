import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Modal, Alert, ActivityIndicator, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../theme";
import { useAuth } from "../lib/auth";
import { addFood, FoodItem, listFoods } from "../lib/data";

const filters = [
  { id: "all", label: "All" },
  { id: "50", label: "Under PHP 50" },
  { id: "100", label: "Under PHP 100" },
  { id: "open", label: "Open now" },
];

export default function Food() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await listFoods(user.id);
    setFoods(res.data);
    setError(res.error);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return foods.filter((f) => {
      const q = search.toLowerCase();
      if (q && !f.name.toLowerCase().includes(q) && !f.shop.toLowerCase().includes(q)) return false;
      if (filter === "50") return Number(f.price) <= 50;
      if (filter === "100") return Number(f.price) <= 100;
      if (filter === "open") return f.open;
      return true;
    });
  }, [foods, filter, search]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Food</Text>
            <Text style={styles.sub}>Your saved affordable places</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={Colors.bg} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput placeholder="Search food or shop" placeholderTextColor={Colors.textDim} value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ gap: 8 }}>
          {filters.map((f) => (
            <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)} style={[styles.chip, filter === f.id && styles.chipActive]}>
              <Text style={[styles.chipText, filter === f.id && { color: Colors.bg }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.results}>{filtered.length} saved</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : error ? (
          <Empty title="Food table unavailable" subtitle={error} />
        ) : filtered.length === 0 ? (
          <Empty title="No food saved" subtitle="Add places you actually use near campus." />
        ) : (
          <View style={styles.list}>
            {filtered.map((f) => (
              <View key={f.id} style={styles.card}>
                <View style={styles.foodIcon}>
                  <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName}>{f.name}</Text>
                  <Text style={styles.shopName}>{f.shop}{f.distance ? ` · ${f.distance}` : ""}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.price}>PHP {Number(f.price || 0).toFixed(0)}</Text>
                  <Text style={styles.open}>{f.open ? "Open" : "Closed"}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
      <AddFoodModal visible={showAdd} onClose={() => setShowAdd(false)} userId={user?.id} onSaved={load} />
    </SafeAreaView>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="restaurant-outline" size={42} color={Colors.textDim} />
      <Text style={styles.emptyT}>{title}</Text>
      <Text style={styles.emptyS}>{subtitle}</Text>
    </View>
  );
}

function AddFoodModal({ visible, onClose, userId, onSaved }: { visible: boolean; onClose: () => void; userId?: string; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [price, setPrice] = useState("");
  const [distance, setDistance] = useState("");
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amount = Number(price);
    if (!userId || !name.trim() || !shop.trim() || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Missing details", "Food, shop, and a valid price are required.");
      return;
    }
    setSaving(true);
    const { error } = await addFood(userId, { name: name.trim(), shop: shop.trim(), price: amount, distance: distance.trim() || null, open });
    setSaving(false);
    if (error) {
      Alert.alert("Could not save food", error);
      return;
    }
    setName("");
    setShop("");
    setPrice("");
    setDistance("");
    setOpen(true);
    onClose();
    onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Add Food</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.text} /></TouchableOpacity>
          </View>
          <Field label="Food" value={name} onChangeText={setName} placeholder="Rice meal" />
          <Field label="Shop" value={shop} onChangeText={setShop} placeholder="Campus canteen" />
          <Field label="Price" value={price} onChangeText={setPrice} placeholder="75" keyboardType="numeric" />
          <Field label="Distance" value={distance} onChangeText={setDistance} placeholder="Optional" />
          <View style={styles.switchRow}>
            <Text style={styles.label}>Open now</Text>
            <Switch value={open} onValueChange={setOpen} thumbColor={Colors.primary} trackColor={{ false: Colors.border, true: Colors.surfaceLight }} />
          </View>
          <TouchableOpacity onPress={save} style={styles.create} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.bg} /> : <Text style={styles.createText}>Save Food</Text>}
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
  scroll: { padding: Spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: Colors.text, fontSize: 24, fontWeight: "800" },
  sub: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, marginTop: 16, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 12 },
  chipScroll: { marginTop: 16, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.surface, borderRadius: 999, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textMuted, fontSize: 13, fontWeight: "600" },
  results: { color: Colors.textMuted, fontSize: 12, marginTop: 16, marginBottom: 10 },
  list: { gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: Colors.border },
  foodIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primary + "18", justifyContent: "center", alignItems: "center" },
  foodName: { color: Colors.text, fontSize: 14, fontWeight: "800" },
  shopName: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  price: { color: Colors.text, fontSize: 14, fontWeight: "900" },
  open: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyT: { color: Colors.text, fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyS: { color: Colors.textMuted, fontSize: 13, marginTop: 4, textAlign: "center" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.62)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, borderWidth: 1, borderColor: Colors.border },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: "800" },
  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.md, padding: 12, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  create: { backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: "center", marginTop: 18 },
  createText: { color: Colors.bg, fontWeight: "800", fontSize: 15 },
});
