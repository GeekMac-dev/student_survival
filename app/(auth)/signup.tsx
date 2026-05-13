import React, { useState, useMemo } from "react";
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

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Senior High"];

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const strength = useMemo(() => getStrength(password), [password]);
  const strengthLabels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [Colors.danger, Colors.danger, Colors.warning, Colors.accent, Colors.success];

  const validate = () => {
    if (!name.trim()) return "Name is required";
    if (!email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Invalid email format";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (strength < 2) return "Password is too weak. Add uppercase, numbers, or symbols";
    if (!school.trim()) return "School is required";
    if (!course.trim()) return "Course is required";
    if (!year) return "Please select your year level";
    return null;
  };

  const handleSignup = async () => {
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setErr(null);
    setLoading(true);
    const { error } = await signUp(email, password, { name, school, course, year_level: year });
    setLoading(false);
    if (error) {
      setErr(error);
    } else {
      Alert.alert("Welcome! 🎉", "Account created successfully!", [
        { text: "Get Started", onPress: () => router.replace("/(tabs)/dashboard") },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.sub}>Join thousands of Filipino students</Text>

          {err && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{err}</Text>
            </View>
          )}

          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputBox}>
            <Ionicons name="person" size={18} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="Juan Reyes" placeholderTextColor={Colors.textDim} value={name} onChangeText={setName} />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail" size={18} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="juan@up.edu.ph" placeholderTextColor={Colors.textDim} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed" size={18} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="At least 8 characters" placeholderTextColor={Colors.textDim} value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Ionicons name={showPw ? "eye-off" : "eye"} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {password.length > 0 && (
            <View style={styles.strength}>
              <View style={styles.strengthBars}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.strengthBar, { backgroundColor: i < strength ? strengthColors[strength] : Colors.border }]} />
                ))}
              </View>
              <Text style={[styles.strengthText, { color: strengthColors[strength] }]}>{strengthLabels[strength]}</Text>
            </View>
          )}

          <Text style={styles.label}>School / University</Text>
          <View style={styles.inputBox}>
            <Ionicons name="school" size={18} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="UP Diliman" placeholderTextColor={Colors.textDim} value={school} onChangeText={setSchool} />
          </View>

          <Text style={styles.label}>Course / Program</Text>
          <View style={styles.inputBox}>
            <Ionicons name="book" size={18} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="BS Computer Science" placeholderTextColor={Colors.textDim} value={course} onChangeText={setCourse} />
          </View>

          <Text style={styles.label}>Year level</Text>
          <View style={styles.yearGrid}>
            {YEARS.map((y) => (
              <TouchableOpacity key={y} onPress={() => setYear(y)} style={[styles.yearChip, year === y && styles.yearChipOn]}>
                <Text style={[styles.yearText, year === y && { color: "#fff" }]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleSignup} style={styles.btn} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity onPress={signInWithGoogle} style={styles.googleBtn}>
            <Ionicons name="logo-google" size={20} color={Colors.text} />
            <Text style={styles.googleText}>Sign up with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" style={styles.footerLink}>
              <Text style={styles.footerLink}>Log in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  scroll: { padding: Spacing.xl },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  title: { color: Colors.text, fontSize: 26, fontWeight: "900" },
  sub: { color: Colors.textMuted, fontSize: 14, marginTop: 6, marginBottom: 20 },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.danger + "22", padding: 12, borderRadius: Radius.md, marginBottom: 12, borderWidth: 1, borderColor: Colors.danger + "44" },
  errorText: { color: Colors.danger, fontSize: 13, flex: 1 },

  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  inputBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 14 },

  strength: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  strengthBars: { flex: 1, flexDirection: "row", gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 11, fontWeight: "700", width: 70, textAlign: "right" },

  yearGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  yearChip: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.surface, borderRadius: 999, borderWidth: 1, borderColor: Colors.border },
  yearChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  yearText: { color: Colors.textMuted, fontSize: 12, fontWeight: "700" },

  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: Radius.md, alignItems: "center", marginTop: 24 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 12 },

  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 14, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  googleText: { color: Colors.text, fontSize: 14, fontWeight: "700" },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24, marginBottom: 30 },
  footerText: { color: Colors.textMuted, fontSize: 14 },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: "800" },
});
