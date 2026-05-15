import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius, Spacing } from "./theme";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

type Msg = { role: "user" | "ai"; text: string; offline?: boolean };

const suggestions = [
  "Summarize my lecture notes",
  "Make a study plan",
  "Explain this topic simply",
  "Generate quiz questions",
];

export default function AI() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Ask a study question. I'm powered by Claude AI and can help with any subject." },
  ]);
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

    let reply: string;
    let offline = false;

    if (!isSupabaseConfigured) {
      reply = localFallbackReply(message);
      offline = true;
    } else {
      try {
        const apiMessages = newMsgs.map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text,
        }));

        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: { messages: apiMessages },
        });

        if (error || !data?.reply) {
          reply = localFallbackReply(message);
          offline = true;
        } else {
          reply = data.reply;
        }
      } catch {
        reply = localFallbackReply(message);
        offline = true;
      }
    }

    setMessages([...newMsgs, { role: "ai", text: reply, offline }]);
    setTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/dashboard")} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headInfo}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={Colors.bg} />
          </View>
          <View>
            <Text style={styles.headTitle}>Study AI</Text>
            <Text style={styles.headSub}>Powered by Claude</Text>
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
                {m.offline && (
                  <View style={styles.offlineBadge}>
                    <Ionicons name="cloud-offline-outline" size={10} color={Colors.textDim} />
                    <Text style={styles.offlineText}>Offline response</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {typing && (
            <View style={[styles.msgRow, styles.aiRow]}>
              <View style={styles.smallAvatar}>
                <Ionicons name="sparkles" size={12} color={Colors.bg} />
              </View>
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.bubbleText}>Thinking…</Text>
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
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about studying"
            placeholderTextColor={Colors.textDim}
            multiline
            onSubmitEditing={() => send()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={() => send()}
            style={[styles.sendBtn, (!input.trim() || typing) && { opacity: 0.45 }]}
            disabled={!input.trim() || typing}
          >
            <Ionicons name="send" size={18} color={Colors.bg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function localFallbackReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("study plan")) {
    return "Try a 3-block plan: 45 min review → 10 min break → 45 min practice questions. Repeat twice, then rest.";
  }
  if (q.includes("summarize") || q.includes("notes")) {
    return "Paste your notes and I'll condense them into key points, terms, and likely quiz questions once I'm back online.";
  }
  if (q.includes("quiz") || q.includes("question")) {
    return "Tell me the topic and difficulty level and I'll generate multiple-choice and short-answer questions.";
  }
  if (q.includes("stressed") || q.includes("anxious") || q.includes("tired")) {
    return "It's okay to feel that way — school is tough. Take a short break, drink water, and come back refreshed. You've got this! 💪";
  }
  if (q.includes("explain") || q.includes("what is") || q.includes("define")) {
    return "I'm currently offline but can explain that topic in detail once reconnected. Try searching your notes or textbook for now.";
  }
  return "I can help with summaries, study plans, explanations, and quiz questions — but I'm in offline mode right now. Check your internet connection and try again.";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingTop: StatusBar.currentHeight || 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headTitle: { color: Colors.text, fontSize: 16, fontWeight: "800" },
  headSub: { color: Colors.textMuted, fontSize: 11 },
  scroll: { padding: Spacing.lg },
  msgRow: { flexDirection: "row", marginBottom: 12, gap: 6 },
  userRow: { justifyContent: "flex-end" },
  aiRow: { justifyContent: "flex-start" },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  bubble: { maxWidth: "82%", padding: 12, borderRadius: 14 },
  userBubble: {
    backgroundColor: Colors.surfaceLight,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  offlineText: { color: Colors.textDim, fontSize: 10 },
  suggestions: { marginTop: 20, gap: 8 },
  suggTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  suggChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggText: { color: Colors.text, fontSize: 13, flex: 1 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    color: Colors.text,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
