import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius, Spacing } from "./theme";
import { supabase } from "./lib/supabase";

type Msg = { role: "user" | "ai"; text: string };

const suggestions = ["Summarize my lecture notes", "Make a study plan", "Explain this topic simply", "Generate quiz questions"];

export default function AI() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "ai", text: "Ask a study question. Responses come from your configured AI backend." }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || typing) return;
    const newMsgs: Msg[] = [...messages, { role: "user", text: message }];
    setMessages(newMsgs);
    setInput("");
    setTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: { messages: newMsgs.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })) },
    });
    const reply = data?.reply || data?.message || (error ? localFallbackReply(message) : "No response returned from the AI backend.");
    setMessages([...newMsgs, { role: "ai", text: reply }]);
    setTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headInfo}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={Colors.bg} />
          </View>
          <View>
            <Text style={styles.headTitle}>Study AI</Text>
            <Text style={styles.headSub}>Backend powered</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
          {messages.map((m, i) => (
            <View key={i} style={[styles.msgRow, m.role === "user" ? styles.userRow : styles.aiRow]}>
              {m.role === "ai" && (
                <View style={styles.smallAvatar}>
                  <Ionicons name="sparkles" size={12} color={Colors.bg} />
                </View>
              )}
              <View style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.aiBubble]}>
                <Text style={styles.bubbleText}>{m.text}</Text>
              </View>
            </View>
          ))}
          {typing && (
            <View style={[styles.msgRow, styles.aiRow]}>
              <View style={styles.smallAvatar}>
                <Ionicons name="sparkles" size={12} color={Colors.bg} />
              </View>
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.bubbleText}>Thinking...</Text>
              </View>
            </View>
          )}

          {messages.length <= 1 && (
            <View style={styles.suggestions}>
              <Text style={styles.suggTitle}>Try asking</Text>
              {suggestions.map((s) => (
                <TouchableOpacity key={s} style={styles.suggChip} onPress={() => send(s)}>
                  <Ionicons name="flash-outline" size={14} color={Colors.primary} />
                  <Text style={styles.suggText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput style={styles.textInput} value={input} onChangeText={setInput} placeholder="Ask anything about studying" placeholderTextColor={Colors.textDim} multiline />
          <TouchableOpacity onPress={() => send()} style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} disabled={!input.trim() || typing}>
            <Ionicons name="send" size={18} color={Colors.bg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function localFallbackReply(input: string) {
  const q = input.toLowerCase();
  if (q.includes("study plan")) {
    return "Try a 3-block plan: 45 minutes review, 10 minutes break, 45 minutes practice questions. Repeat once.";
  }
  if (q.includes("summarize")) {
    return "Paste your notes and I will condense them into key points, terms, and likely quiz questions.";
  }
  if (q.includes("quiz")) {
    return "Tell me the topic and difficulty, and I will generate multiple-choice and short-answer questions.";
  }
  return "I can still help offline. Ask for a summary, study plan, explanation, or quiz for a specific subject.";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  header: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  headInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  aiAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  headTitle: { color: Colors.text, fontSize: 16, fontWeight: "800" },
  headSub: { color: Colors.textMuted, fontSize: 11 },
  scroll: { padding: Spacing.lg },
  msgRow: { flexDirection: "row", marginBottom: 12, gap: 6 },
  userRow: { justifyContent: "flex-end" },
  aiRow: { justifyContent: "flex-start" },
  smallAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", marginTop: 4 },
  bubble: { maxWidth: "82%", padding: 12, borderRadius: 14 },
  userBubble: { backgroundColor: Colors.surfaceLight, borderBottomRightRadius: 4, borderWidth: 1, borderColor: Colors.border },
  aiBubble: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  suggestions: { marginTop: 20, gap: 8 },
  suggTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  suggChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  suggText: { color: Colors.text, fontSize: 13, flex: 1 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 8, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  textInput: { flex: 1, backgroundColor: Colors.surfaceLight, color: Colors.text, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
});
