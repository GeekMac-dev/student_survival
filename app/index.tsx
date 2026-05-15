import { useEffect } from "react";
import { Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Colors } from "./theme";
import { useAuth } from "./lib/auth";

export default function Splash() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) router.replace("/(tabs)/dashboard");
      else router.replace("/(auth)/login");
    }, 700);
    return () => clearTimeout(t);
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>SK</Text>
      </View>
      <Text style={styles.title}>Sulit</Text>
      <Text style={styles.subtitle}>Budget, plan, and get through school.</Text>
      <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      <Text style={styles.tag}>Made for Filipino students</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center", padding: 24 },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: { fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: 2 },
  title: { fontSize: 42, fontWeight: "900", color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textMuted, marginTop: 6, textAlign: "center" },
  tag: { position: "absolute", bottom: 40, color: Colors.textDim, fontSize: 13 },
});
