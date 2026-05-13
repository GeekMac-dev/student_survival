import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius, Spacing } from "../theme";
import { useAuth } from "../lib/auth";

export default function Forgot() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Please enter a valid email");
      return;
    }
    setErr(null);
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) setErr(error);
    else setSent(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Ionicons name="mail" size={36} color={Colors.success} />
            </View>
            <Text style={styles.title}>Check your inbox!</Text>
            <Text style={styles.sub}>
              We sent a password reset link to{"\n"}<Text style={{ color: Colors.text, fontWeight: "700" }}>{email}</Text>
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.btn}>
              <Text style={styles.btnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.icon}>
              <Ionicons name="lock-closed" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.sub}>Enter your email and we'll send you a reset link.</Text>

            {err && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{err}</Text>
              </View>
            )}

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="juan@up.edu.ph"
                placeholderTextColor={Colors.textDim}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity onPress={handleSubmit} style={styles.btn} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: "center", marginTop: 16 }}>
              <Text style={{ color: Colors.primary, fontWeight: "700" }}>Back to login</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  scroll: { padding: Spacing.xl },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
  icon: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.primary + "22", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  title: { color: Colors.text, fontSize: 26, fontWeight: "900" },
  sub: { color: Colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 20, lineHeight: 20 },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.danger + "22", padding: 12, borderRadius: Radius.md, marginBottom: 12, borderWidth: 1, borderColor: Colors.danger + "44" },
  errorText: { color: Colors.danger, fontSize: 13, flex: 1 },

  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  inputBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 14 },

  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: Radius.md, alignItems: "center", marginTop: 24 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  successBox: { alignItems: "center", paddingTop: 40 },
  successIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.success + "22", justifyContent: "center", alignItems: "center", marginBottom: 20 },
});
