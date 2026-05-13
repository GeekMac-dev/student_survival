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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Link } from "expo-router";
import { Colors, Radius, Spacing } from "../theme";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const validate = () => {
    if (!email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Invalid email format";
    if (!password) return "Password is required";
    return null;
  };

  const handleLogin = async () => {
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setErr(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setErr(error);
    } else {
      router.replace("/(tabs)/dashboard");
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) Alert.alert("Google sign-in", error);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Text style={styles.logoText}>SK</Text>
          </View>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.sub}>Mag-login para magpatuloy</Text>

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
              autoComplete="email"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Ionicons name={showPw ? "eye-off" : "eye"} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/(auth)/forgot")} style={styles.forgot}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} style={styles.btn} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Log In</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity onPress={handleGoogle} style={styles.googleBtn} disabled={loading}>
            <Ionicons name="logo-google" size={20} color={Colors.text} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Wala pang account? </Text>
            <Link href="/(auth)/signup" style={styles.footerLink}>
              <Text style={styles.footerLink}>Sign up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  scroll: { padding: Spacing.xl, paddingTop: 40 },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 20 },
  logoText: { color: "#fff", fontWeight: "900", fontSize: 24, letterSpacing: 1 },
  title: { color: Colors.text, fontSize: 28, fontWeight: "900", textAlign: "center" },
  sub: { color: Colors.textMuted, fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 28 },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.danger + "22", padding: 12, borderRadius: Radius.md, marginBottom: 12, borderWidth: 1, borderColor: Colors.danger + "44" },
  errorText: { color: Colors.danger, fontSize: 13, flex: 1 },

  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  inputBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 14 },

  forgot: { alignSelf: "flex-end", marginTop: 10 },
  forgotText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },

  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: Radius.md, alignItems: "center", marginTop: 20 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 12 },

  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 14, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  googleText: { color: Colors.text, fontSize: 14, fontWeight: "700" },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText: { color: Colors.textMuted, fontSize: 14 },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: "800" },
});
