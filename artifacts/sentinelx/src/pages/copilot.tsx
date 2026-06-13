import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSendCopilotMessage,
  useGetCopilotHistory,
  getGetCopilotHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Bot, 
  Send, 
  User, 
  Shield, 
  Zap, 
  TrendingUp, 
  FileSearch, 
  ChevronDown, 
  Activity, 
  Cpu, 
  Sparkles, 
  Terminal, 
  AlertTriangle,
  Trash2
} from "lucide-react";

const SUGGESTIONS = [
  { icon: Zap, text: "Explain the current attack chain", context: "red_team" },
  { icon: TrendingUp, text: "What is the financial risk exposure?", context: "commander" },
  { icon: FileSearch, text: "Generate a MITRE ATT&CK coverage report", context: "general" },
  { icon: Shield, text: "What defensive gaps exist right now?", context: "blue_team" },
];

const CONTEXTS = [
  { value: "general", label: "General Ops" },
  { value: "red_team", label: "Red Team Sim" },
  { value: "blue_team", label: "Blue Team Def" },
  { value: "commander", label: "Commander View" },
  { value: "incident", label: "Incident Resp" },
];

// Canvas-based holographic orb visualizing AI states
function HolographicOrb({ isThinking }: { isThinking: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const baseRadius = 60;
      
      const speed = isThinking ? 0.09 : 0.025;
      const amplitudeFactor = isThinking ? 16 : 5;
      
      phase += speed;

      // Draw radar sweep grids
      ctx.strokeStyle = "rgba(255, 23, 68, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.75, 0, Math.PI * 2);
      ctx.stroke();

      // Overlapping sine wave bands
      const numWaves = 4;
      for (let w = 0; w < numWaves; w++) {
        ctx.beginPath();
        const wavePhase = phase + w * (Math.PI / 2);
        const waveFreq = 3 + w;
        const currentAmp = amplitudeFactor * (1 - w * 0.15);
        
        if (isThinking) {
          ctx.strokeStyle = w === 0 
            ? "rgba(255, 23, 68, 0.9)" 
            : `rgba(255, 50, 90, ${0.55 - w * 0.12})`;
        } else {
          ctx.strokeStyle = w === 0 
            ? "rgba(255, 23, 68, 0.6)" 
            : `rgba(255, 23, 68, ${0.35 - w * 0.08})`;
        }
        
        ctx.lineWidth = w === 0 ? 2 : 1.2;
        
        if (isThinking && w === 0) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = "rgba(255, 23, 68, 0.8)";
        } else {
          ctx.shadowBlur = 0;
        }

        for (let theta = 0; theta <= Math.PI * 2; theta += 0.03) {
          const r = baseRadius + Math.sin(theta * waveFreq + wavePhase) * currentAmp 
                    + Math.cos(theta * 2 - wavePhase * 1.3) * (currentAmp * 0.35);
          
          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);
          
          if (theta === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Center core radial glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, baseRadius * 0.6);
      glowGrad.addColorStop(0, isThinking ? "rgba(255, 23, 68, 0.4)" : "rgba(255, 23, 68, 0.15)");
      glowGrad.addColorStop(0.8, "rgba(255, 23, 68, 0.02)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Floating neural points
      ctx.fillStyle = "rgba(255, 23, 68, 0.75)";
      ctx.shadowBlur = 0;
      const numNodes = 6;
      for (let n = 0; n < numNodes; n++) {
        const offsetAngle = phase * 0.4 + n * (Math.PI * 2 / numNodes);
        const distance = baseRadius * 0.45 * (1 + Math.sin(phase * 0.7 + n) * 0.15);
        const nx = cx + distance * Math.cos(offsetAngle);
        const ny = cy + distance * Math.sin(offsetAngle);
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Connector paths
        ctx.strokeStyle = "rgba(255, 23, 68, 0.1)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isThinking]);

  return (
    <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={180} 
        height={180} 
        className="w-full h-full drop-shadow-[0_0_15px_rgba(255,23,68,0.25)]"
      />
      <div className="absolute inset-0 rounded-full border border-dashed border-primary/20 animate-[spin_35s_linear_infinite]" />
      <div className="absolute w-[85%] h-[85%] rounded-full border border-dotted border-primary/10 animate-[spin_18s_linear_infinite_reverse]" />
    </div>
  );
}

// Voice equalizer visualizer component
function VoiceVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-end justify-center gap-[3px] h-8 px-4">
      {Array.from({ length: 18 }).map((_, i) => {
        const baseHeight = 4 + (i % 4) * 4 + (i % 3) * 2;
        return (
          <motion.div
            key={i}
            className="w-[2px] bg-primary rounded-full"
            initial={{ height: 4 }}
            animate={
              isActive
                ? {
                    height: [baseHeight, baseHeight * 2.8, baseHeight * 0.4, baseHeight],
                  }
                : {
                    height: [baseHeight, baseHeight + 2, baseHeight - 1, baseHeight],
                  }
            }
            transition={{
              duration: isActive ? 0.55 + (i % 5) * 0.08 : 2.5 + (i % 3) * 0.35,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}

export default function Copilot() {
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("general");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const executeClear = async () => {
    try {
      const res = await fetch("/api/copilot/history", {
        method: "DELETE",
      });
      if (res.ok) {
        qc.setQueryData(getGetCopilotHistoryQueryKey(), []);
        qc.invalidateQueries({ queryKey: getGetCopilotHistoryQueryKey() });
      }
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    } finally {
      setShowClearConfirm(false);
    }
  };

  const handleSend = () => {
    if (!message.trim() || send.isPending) return;
    send.mutate({ data: { message: message.trim(), context: context as any } });
  };

  const handleSuggestion = (text: string, ctx: string) => {
    setContext(ctx);
    send.mutate({ data: { message: text, context: ctx as any } });
  };

  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-12 overflow-hidden bg-transparent">
      {/* LEFT COLUMN: Main Chat Portal (8/12 width) */}
      <div className="lg:col-span-8 flex flex-col h-full border-r border-border/85 min-w-0 min-h-0">
        
        {/* Chat Interface Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/70 bg-card/25 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Bot size={18} className="text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-mono tracking-wider text-glow uppercase">Security AI Analyst</h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Active Telemetry Watchdog</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground hidden sm:inline">VECTOR CONTEXT:</span>
            <div className="relative">
              <select
                data-testid="select-copilot-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="bg-[#0F0F14] border border-border text-xs text-primary font-mono rounded-lg px-3 py-1.5 pr-8 focus:border-primary focus:outline-none appearance-none cursor-pointer hover:border-primary/50 transition-colors"
              >
                {CONTEXTS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
            </div>

            <motion.button
              whileHover={{ scale: 1.04, y: -0.5 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleClearHistory}
              data-testid="btn-clear-copilot"
              className="px-3 py-1.5 bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 text-destructive rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-[0_0_12px_rgba(255,23,68,0.2)]"
              title="Clear Conversation History"
            >
              <motion.span whileHover={{ rotate: 15 }} className="inline-flex">
                <Trash2 size={13} />
              </motion.span>
              <span className="hidden sm:inline">CLEAR</span>
            </motion.button>
          </div>
        </div>

        {/* Chat Messages Feed Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[linear-gradient(to_bottom,rgba(255,23,68,0.015)_0%,transparent_100%)]">
          {(history ?? []).length === 0 && !send.isPending && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center justify-center h-full min-h-[350px] p-6 text-center"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Bot size={32} className="text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <h2 className="text-base font-bold font-mono tracking-wider mb-2 text-glow uppercase">SentinelX Cyber Copilot</h2>
              <p className="text-xs text-muted-foreground font-sans max-w-sm mb-8 leading-relaxed">
                Holographic security intelligence model holding absolute awareness over the virtual cyber range simulation nodes and exploits.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTIONS.map(({ icon: Icon, text, context: ctx }) => (
                  <button
                    key={text}
                    data-testid={`button-suggestion-${text.slice(0, 10).replace(/\s/g, "-")}`}
                    onClick={() => handleSuggestion(text, ctx)}
                    className="flex items-center gap-3 p-3.5 glass-panel rounded-xl text-left border border-border/50 hover:border-primary/50 transition-all group relative overflow-hidden"
                  >
                    <div className="w-7 h-7 rounded bg-primary/5 border border-primary/15 flex items-center justify-center group-hover:bg-primary/15 transition-all">
                      <Icon size={14} className="text-primary flex-shrink-0" />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors font-mono line-clamp-2">{text}</span>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-primary/5 rotate-45 translate-x-4 -translate-y-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {(history ?? []).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25 }}
                data-testid={`message-${msg.role}-${msg.id}`}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                  msg.role === "user" 
                    ? "bg-slate-900 border-slate-700" 
                    : "bg-primary/10 border-primary/30"
                }`}>
                  {msg.role === "user" ? (
                    <User size={14} className="text-slate-400" />
                  ) : (
                    <Bot size={14} className="text-primary" />
                  )}
                </div>
                
                <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                  <div className={`px-4 py-3 rounded-2xl text-xs font-mono leading-relaxed border ${
                    msg.role === "user" 
                      ? "bg-slate-900/60 text-slate-200 border-slate-800 rounded-tr-sm" 
                      : "glass-panel text-foreground border-primary/10 rounded-tl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 px-1 text-[10px] font-mono text-muted-foreground">
                    {msg.context && msg.context !== "general" && (
                      <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-md uppercase text-[9px] tracking-wider font-bold">
                        {msg.context}
                      </span>
                    )}
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {send.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Bot size={14} className="text-primary animate-pulse" />
              </div>
              <div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-sm border border-primary/10">
                <div className="flex gap-1.5 py-1 items-center">
                  <span className="text-[10px] font-mono text-primary mr-1 animate-pulse uppercase">PROCESSING CORES</span>
                  {[0, 1, 2].map((i) => (
                    <motion.div 
                      key={i} 
                      className="w-1.5 h-1.5 rounded-full bg-primary" 
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} 
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Message Input Panel */}
        <div className="p-4 border-t border-border/70 bg-card/10 backdrop-blur-md">
          {/* Quick command suggestions visible on top of input when messages exist */}
          {(history ?? []).length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-thin">
              {SUGGESTIONS.map(({ text, context: ctx }) => (
                <button
                  key={text}
                  onClick={() => handleSuggestion(text, ctx)}
                  className="flex-shrink-0 px-3 py-1 bg-slate-950 border border-border hover:border-primary/45 rounded-full text-[10px] font-mono text-muted-foreground hover:text-primary transition-all"
                >
                  &gt; {text}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <input
              data-testid="input-copilot-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Query security posture, active exploits, defensive recommendations..."
              className="flex-1 bg-[#060608] border border-border/80 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-primary/60 focus:outline-none transition-all focus:shadow-[0_0_12px_rgba(255,23,68,0.06)]"
            />
            <button
              data-testid="button-send-message"
              onClick={handleSend}
              disabled={!message.trim() || send.isPending}
              className="px-4 py-3 bg-primary/15 border border-primary/40 text-primary rounded-xl hover:bg-primary/25 disabled:opacity-40 transition-all flex items-center justify-center"
            >
              <Send size={15} />
            </button>
          </div>
          <div className="flex justify-between items-center mt-2.5 px-1">
            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              INTELLIGENCE AGENT ONLINE
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              RECOGNIZER ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Hologram & Cybernetic Command Dossier (4/12 width) */}
      <div className="lg:col-span-4 bg-card/10 p-5 flex flex-col justify-between h-full space-y-6 overflow-y-auto min-h-0">
        
        {/* Neural Core Hologram */}
        <div className="glass-panel border border-border/50 rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-3 left-4 flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest text-primary">
            <Sparkles size={11} className="animate-spin" />
            <span>AI NEURAL CORE</span>
          </div>
          
          <div className="absolute top-3 right-4 font-mono text-[9px] text-muted-foreground border border-slate-800 px-1.5 py-0.5 rounded uppercase">
            {send.isPending ? "THINKING" : "IDLE"}
          </div>

          <div className="my-6">
            <HolographicOrb isThinking={send.isPending} />
          </div>

          <div className="w-full text-center space-y-3">
            <div className="font-mono text-xs font-bold tracking-wider text-glow uppercase">
              {send.isPending ? "COMPILING RESPONSE..." : "SENTINEL-X AI SYNCED"}
            </div>
            
            <VoiceVisualizer isActive={send.isPending} />
          </div>
        </div>

        {/* Telemetry Dossier Panel */}
        <div className="glass-panel border border-border/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-1">
            <Terminal size={14} className="text-primary" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-glow">System Dossier</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#060608] border border-border/40 p-2.5 rounded-lg flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-muted-foreground uppercase">AI COGNITIVE LOAD</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-200 font-bold">142 T/S</span>
                <Cpu size={12} className="text-primary/75" />
              </div>
            </div>
            <div className="bg-[#060608] border border-border/40 p-2.5 rounded-lg flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-muted-foreground uppercase">API CONNECTIVITY</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-200 font-bold">STABLE</span>
                <Activity size={12} className="text-emerald-500 animate-pulse" />
              </div>
            </div>
            <div className="bg-[#060608] border border-border/40 p-2.5 rounded-lg flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-muted-foreground uppercase">CONTEXT EXPIRY</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-200 font-bold">PERSISTED</span>
                <Shield size={12} className="text-primary/75" />
              </div>
            </div>
            <div className="bg-[#060608] border border-border/40 p-2.5 rounded-lg flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-muted-foreground uppercase">SIMULATION CLOCK</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-200 font-bold">LIVE SYNC</span>
                <AlertTriangle size={12} className="text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Vector Info Panel */}
        <div className="glass-panel border border-border/50 rounded-xl p-4 space-y-2 text-xs font-mono">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Selected Vector Info</span>
          {context === "general" && (
            <p className="text-muted-foreground text-[10px] leading-relaxed">
              Provides general security assistance, answering questions about common vulnerabilities, standard security measures, and basic dashboard metrics.
            </p>
          )}
          {context === "red_team" && (
            <p className="text-primary/80 text-[10px] leading-relaxed">
              Monitors red-team execution payloads. Deep insight into malicious nodes, attack chains, and simulated vectors currently attacking range infrastructure.
            </p>
          )}
          {context === "blue_team" && (
            <p className="text-emerald-500/80 text-[10px] leading-relaxed">
              Analyzes defensive posture, alert thresholds, firewall log triggers, and vulnerability patching options to protect simulated servers.
            </p>
          )}
          {context === "commander" && (
            <p className="text-amber-500/80 text-[10px] leading-relaxed">
              Surveys mission operations, financial liabilities, risk assessments, and overall target readiness scores across the cyber range database.
            </p>
          )}
          {context === "incident" && (
            <p className="text-glow text-[10px] leading-relaxed">
              Handles active indicators of compromise, live log auditing, and immediate remediation commands for servers showing active compromise alerts.
            </p>
          )}
        </div>
      </div>

      {/* CUSTOM ANIMATED CONFIRM PURGE MODAL */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-primary/20 bg-[#0A0A0C]/95 shadow-[0_0_50px_rgba(255,23,68,0.15)] space-y-4 font-mono"
            >
              <div className="flex items-center gap-3 text-primary">
                <AlertTriangle className="h-6 w-6 text-primary animate-pulse" />
                <h3 className="text-sm font-bold tracking-widest uppercase text-glow">Purge Chat Database?</h3>
              </div>
              
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider">
                This action will permanently delete all conversation history with the Security AI Analyst from the active terminal session.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border border-border bg-slate-900/40 hover:bg-slate-900 text-slate-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  ABORT
                </button>
                <button
                  onClick={executeClear}
                  className="flex-1 px-4 py-2 bg-destructive/20 border border-destructive/60 hover:bg-destructive/30 text-primary rounded-lg text-xs font-bold transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(255,23,68,0.25)]"
                >
                  CONFIRM PURGE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
