import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import {
  CheckCircle2, Circle, AlertTriangle, Sparkles, ChevronDown, ChevronUp,
  X, Loader2, Flag, Brain, RefreshCw, Wand2, Clock, Target, Zap, Map, Calendar, Timer, ArrowRight
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

function AiHelpDialog({ taskLabel, onResolve, onClose }) {
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState(null);

  const ask = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Help a user complete this specific task: "${taskLabel}"

Provide a clear, step-by-step breakdown:
1. Break it into 3-5 tiny actionable steps
2. Give a time estimate for each step
3. Mention any common pitfalls to avoid
4. End with encouragement

Keep it practical and concise.`
    });
    setGuidance(result);
    setLoading(false);
  };

  React.useEffect(() => { ask(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-violet-200 dark:border-violet-800 shadow-xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">AI Task Assistant</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-xs text-muted-foreground italic bg-card/50 rounded-lg p-2">"{taskLabel}"</p>

        {loading ? (
          <div className="flex items-center gap-2 py-6 justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <span className="text-sm text-muted-foreground">Generating your action plan…</span>
          </div>
        ) : guidance ? (
          <>
            <div className="rounded-xl bg-card/70 border border-border p-4">
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{guidance}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setGuidance(null); setLoading(true); ask(); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate
              </Button>
              <Button size="sm" variant="outline" onClick={() => { onResolve(); onClose(); }}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Got it!
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
            </div>
          </>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

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
  const [aiHelpTarget, setAiHelpTarget] = useState(null); // { label, priorityId, taskId }

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
        {aiHelpTarget && (
          <AiHelpDialog
            taskLabel={aiHelpTarget.label}
            onResolve={() => toggleTaskDone(aiHelpTarget.priorityId, aiHelpTarget.taskId)}
            onClose={() => setAiHelpTarget(null)}
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

        {/* AI Plan */}
        {plan.ai_plan && (
          <div className="border-b border-border">
            <button
              onClick={() => setShowAiPlan(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 hover:from-violet-500/15 hover:via-purple-500/15 hover:to-pink-500/15 transition-all border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/25">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">{plan.detailed ? "Detailed Action Plan" : "Plan Summary"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" /> AI-powered workflow with time estimates
                  </p>
                </div>
              </div>
              {showAiPlan ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showAiPlan && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 pb-4 pt-3"
              >
                <div className="rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border border-violet-200 dark:border-violet-800 p-5 max-h-[600px] overflow-y-auto shadow-lg">
                  {/* Plan Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-xl bg-white/70 dark:bg-slate-800/70 border border-violet-200 dark:border-violet-800 p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Map className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-xs font-semibold text-muted-foreground">Priorities</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{plan.priorities.length}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 dark:bg-slate-800/70 border border-violet-200 dark:border-violet-800 p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-xs font-semibold text-muted-foreground">Tasks</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{totalTasks}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 dark:bg-slate-800/70 border border-violet-200 dark:border-violet-800 p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Timer className="w-3.5 h-3.5 text-pink-500" />
                        <span className="text-xs font-semibold text-muted-foreground">Complete</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-600">{progress}%</p>
                    </div>
                  </div>

                  {/* Visual Workflow Map */}
                  <div className="mb-5">
                    <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                      <Map className="w-3.5 h-3.5 text-violet-500" />
                      Your Workflow Map
                    </h4>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {plan.priorities.map((p, idx) => (
                        <React.Fragment key={p.id}>
                          <div className={`shrink-0 rounded-xl border-2 ${p.done ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800"} p-3 min-w-[140px]`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {idx + 1}
                              </div>
                              <Flag className={`w-3.5 h-3.5 ${LEVEL_COLOR[p.priority_level]}`} />
                            </div>
                            <p className="text-xs font-semibold text-foreground line-clamp-2">{p.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{p.tasks.filter(t => t.done).length}/{p.tasks.length} tasks</p>
                          </div>
                          {idx < plan.priorities.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* AI Plan Content */}
                  <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 border border-border p-4 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold text-foreground mb-2 pb-2 border-b border-violet-200" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold text-foreground mb-2 pb-1 border-b border-violet-100" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-1.5 mt-3" {...props} />,
                        p: ({node, ...props}) => <p className="text-sm text-foreground mb-2 leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-3 ml-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-3 ml-2" {...props} />,
                        li: ({node, ...props}) => <li className="text-sm text-foreground" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                        em: ({node, ...props}) => <em className="text-muted-foreground italic" {...props} />,
                      }}
                    >
                      {plan.ai_plan}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Priorities & Tasks */}
        <div className="px-5 py-4 space-y-4">
          {plan.priorities.map((p, idx) => (
            <div key={p.id} className={`rounded-xl border ${p.done ? "bg-muted/30 border-border opacity-70" : "bg-card border-border shadow-sm"} p-3 transition-all`}>
              {/* Priority row */}
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => togglePriorityDone(p.id)} className="shrink-0">
                  {p.done
                    ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    : <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />}
                </button>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                </div>
                <Flag className={`w-4 h-4 shrink-0 ${LEVEL_COLOR[p.priority_level] || ""}`} />
                <span className={`flex-1 text-sm font-bold ${p.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{p.title}</span>
                <button
                  onClick={() => setStruggleTarget({ label: p.title, priorityId: p.id })}
                  className="opacity-0 group-hover/p:opacity-100 transition-opacity text-muted-foreground hover:text-orange-500"
                  title="Having trouble with this priority?"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks */}
              {p.tasks.length > 0 && (
                <div className="pl-16 space-y-1.5">
                  {p.tasks.map((t, tIdx) => (
                    <div key={t.id} className="flex items-center gap-2 group/t p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <button onClick={() => toggleTaskDone(p.id, t.id)} className="shrink-0">
                        {t.done
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
                      </button>
                      <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.text}</span>
                      <button
                        onClick={() => setAiHelpTarget({ label: t.text, priorityId: p.id, taskId: t.id })}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-200 dark:border-violet-800 transition-all"
                        title="Get AI help with this task"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-xs font-medium text-violet-600 dark:text-violet-400">AI Help</span>
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