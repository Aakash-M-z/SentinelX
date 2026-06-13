import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSendCopilotMessage,
  useGetCopilotHistory,
  getGetCopilotHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Send, User, Shield, Zap, TrendingUp, FileSearch, ChevronDown } from "lucide-react";

const SUGGESTIONS = [
  { icon: Zap, text: "Explain the current attack chain", context: "red_team" },
  { icon: TrendingUp, text: "What is the financial risk exposure?", context: "commander" },
  { icon: FileSearch, text: "Generate a MITRE ATT&CK coverage report", context: "general" },
  { icon: Shield, text: "What defensive gaps exist right now?", context: "blue_team" },
];

const CONTEXTS = [
  { value: "general", label: "General" },
  { value: "red_team", label: "Red Team" },
  { value: "blue_team", label: "Blue Team" },
  { value: "commander", label: "Commander" },
  { value: "incident", label: "Incident Response" },
];

export default function Copilot() {
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("general");
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { data: history } = useGetCopilotHistory();
  const send = useSendCopilotMessage({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCopilotHistoryQueryKey() });
        setMessage("");
      },
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = () => {
    if (!message.trim() || send.isPending) return;
    send.mutate({ data: { message: message.trim(), context: context as any } });
  };

  const handleSuggestion = (text: string, ctx: string) => {
    setContext(ctx);
    send.mutate({ data: { message: text, context: ctx as any } });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Security Copilot</h1>
            <p className="text-xs text-muted-foreground">AI analyst with live simulation awareness</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Context:</span>
          <div className="relative">
            <select
              data-testid="select-copilot-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-background border border-border text-xs text-primary rounded-lg px-3 py-1.5 pr-7 focus:border-primary focus:outline-none appearance-none cursor-pointer"
            >
              {CONTEXTS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(history ?? []).length === 0 && !send.isPending && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
              <Bot size={28} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">SentinelX Copilot</h2>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">AI-powered security analyst with full situational awareness of your cyber range simulation.</p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(({ icon: Icon, text, context: ctx }) => (
                <button
                  key={text}
                  data-testid={`button-suggestion-${text.slice(0, 10).replace(/\s/g, "-")}`}
                  onClick={() => handleSuggestion(text, ctx)}
                  className="flex items-center gap-2 p-3 glass-panel rounded-xl text-left hover:border-primary/50 transition-all group"
                >
                  <Icon size={14} className="text-primary flex-shrink-0" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {(history ?? []).map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              data-testid={`message-${msg.role}-${msg.id}`}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-muted border border-border" : "bg-primary/20 border border-primary/40"}`}>
                {msg.role === "user" ? <User size={13} className="text-muted-foreground" /> : <Bot size={13} className="text-primary" />}
              </div>
              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-muted text-foreground rounded-tr-sm border border-border" : "glass-panel text-foreground rounded-tl-sm"}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  {msg.context && msg.context !== "general" && (
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">{msg.context}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {send.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Bot size={13} className="text-primary" />
            </div>
            <div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-3">
          <input
            data-testid="input-copilot-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about threats, incidents, attack chains..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:bg-background transition-all"
          />
          <button
            data-testid="button-send-message"
            onClick={handleSend}
            disabled={!message.trim() || send.isPending}
            className="px-4 py-3 bg-primary/20 border border-primary/50 text-primary rounded-xl hover:bg-primary/30 disabled:opacity-40 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">AI responses are generated based on live simulation data</p>
      </div>
    </div>
  );
}
