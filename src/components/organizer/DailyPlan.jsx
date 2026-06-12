import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Circle, AlertTriangle, Sparkles,
  X, Loader2, Flag, Brain, RefreshCw
} from "lucide-react";

const LEVEL_COLOR = { critical: "text-red-500", high: "text-orange-500", medium: "text-yellow-500", low: "text-green-500" };

const CHALLENGE_OPTIONS = [
  "I don't know where to start",
  "It feels overwhelming",
  "I keep getting distracted",
  "I'm waiting on someone else",
  "I don't have the resources I need",
  "I'm unclear on what to do",
  "I feel anxious about this",
  "I'm low energy right now",
];

function StruggleDialog({ label, onResolve, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState(null);

  const toggle = (opt) => setSelected(prev => {
    const next = new Set(prev);
    next.has(opt) ? next.delete(opt) : next.add(opt);
    return next;
  });

  const ask = async () => {
    const challenges = [...selected, ...(custom.trim() ? [custom.trim()] : [])];
    if (!challenges.length) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
    prompt: `A user is struggling with: "${label}"
    Their challenges: ${challenges.join(", ")}

    Give 3-4 specific, practical, encouraging tips to help them get unstuck. Keep each tip to 1-2 sentences. Be warm and supportive — not clinical.`
    });
    setTips(result);
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-foreground">Having trouble with this?</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-xs text-muted-foreground italic">"{label}"</p>

        {!tips ? (
          <>
            <p className="text-sm text-foreground font-medium">What's making this difficult?</p>
            <div className="grid grid-cols-1 gap-1.5">
              {CHALLENGE_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${selected.has(opt) ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted/30"}`}>
                  <input type="checkbox" checked={selected.has(opt)} onChange={() => toggle(opt)} className="accent-primary" />
                  {opt}
                </label>
              ))}
            </div>
            <Textarea placeholder="Or describe in your own words…" value={custom} onChange={e => setCustom(e.target.value)} className="text-sm resize-none min-h-[60px]" />
            <div className="flex gap-2">
              <Button size="sm" onClick={ask} disabled={selected.size === 0 && !custom.trim() || loading}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                Get help
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-primary"><Brain className="w-3.5 h-3.5" /> Here are some ideas:</div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{tips}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setTips(null); setSelected(new Set()); setCustom(""); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Try different approach
              </Button>
              <Button size="sm" variant="outline" onClick={() => { onResolve(); onClose(); }}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> That helped!
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function DailyPlan({ plan, onUpdate, onDismiss }) {
  const [showAiPlan, setShowAiPlan] = useState(false);
  const [struggleTarget, setStruggleTarget] = useState(null); // { label, priorityId, taskId? }

  if (!plan) return null;

  const togglePriorityDone = (pid) => {
    onUpdate({
      ...plan,
      priorities: plan.priorities.map(p => p.id === pid ? { ...p, done: !p.done } : p)
    });
  };

  const toggleTaskDone = (pid, tid) => {
    onUpdate({
      ...plan,
      priorities: plan.priorities.map(p => p.id === pid
        ? { ...p, tasks: p.tasks.map(t => t.id === tid ? { ...t, done: !t.done } : t) }
        : p)
    });
  };

  const totalTasks = plan.priorities.flatMap(p => p.tasks).length;
  const doneTasks = plan.priorities.flatMap(p => p.tasks).filter(t => t.done).length;
  const donePriorities = plan.priorities.filter(p => p.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <>
      <AnimatePresence>
        {struggleTarget && (
          <StruggleDialog
            label={struggleTarget.label}
            onResolve={() => {
              if (struggleTarget.taskId) toggleTaskDone(struggleTarget.priorityId, struggleTarget.taskId);
              else togglePriorityDone(struggleTarget.priorityId);
            }}
            onClose={() => setStruggleTarget(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm leading-tight">Today's Plan</h2>
                {plan.focus && <p className="text-xs text-muted-foreground">Focus: {plan.focus}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{donePriorities}/{plan.priorities.length} priorities · {doneTasks}/{totalTasks} tasks</span>
              <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Priorities & Tasks */}
        <div className="px-5 py-4 space-y-4">
          {plan.priorities.map((p, idx) => (
            <div key={p.id} className={`space-y-2 ${p.done ? "opacity-60" : ""}`}>
              {/* Priority row */}
              <div className="flex items-center gap-2 group/p">
                <button onClick={() => togglePriorityDone(p.id)} className="shrink-0">
                  {p.done
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
                </button>
                <span className="text-xs font-bold text-muted-foreground shrink-0">{idx + 1}.</span>
                <Flag className={`w-3.5 h-3.5 shrink-0 ${LEVEL_COLOR[p.priority_level] || ""}`} />
                <span className={`flex-1 text-sm font-semibold ${p.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{p.title}</span>
                <button
                  onClick={() => setStruggleTarget({ label: p.title, priorityId: p.id })}
                  className="opacity-0 group-hover/p:opacity-100 transition-opacity text-muted-foreground hover:text-orange-500"
                  title="Having trouble with this?"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks */}
              {p.tasks.length > 0 && (
                <div className="pl-9 space-y-1.5">
                  {p.tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 group/t">
                      <button onClick={() => toggleTaskDone(p.id, t.id)} className="shrink-0">
                        {t.done
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <Circle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />}
                      </button>
                      <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.text}</span>
                      <button
                        onClick={() => setStruggleTarget({ label: t.text, priorityId: p.id, taskId: t.id })}
                        className="opacity-0 group-hover/t:opacity-100 transition-opacity text-muted-foreground hover:text-orange-500"
                        title="Having trouble with this?"
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {progress === 100 && (
          <div className="px-5 pb-5">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
              <p className="text-sm font-semibold text-emerald-700">🎉 You did it! All tasks complete.</p>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}