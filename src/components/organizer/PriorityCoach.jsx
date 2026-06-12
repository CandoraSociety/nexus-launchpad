import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { differenceInDays, parseISO, isValid } from "date-fns";
import {
  Sparkles, X, ChevronRight, CheckSquare, Flag, GripVertical,
  Plus, Loader2, Check, AlertTriangle, ArrowUpDown
} from "lucide-react";

function nanoid() { return Math.random().toString(36).slice(2, 10); }

const LEVEL_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const LEVEL_COLOR = { critical: "text-red-500", high: "text-orange-500", medium: "text-yellow-500", low: "text-green-500" };

function getDaysLeft(due_date) {
  if (!due_date) return null;
  const d = parseISO(due_date);
  if (!isValid(d)) return null;
  return differenceInDays(d, new Date());
}

// Step 1 — AI recommends, user selects priorities
function StepRecommend({ priorities, focusToday, onNext, onClose }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const analyze = async () => {
    setLoading(true);
    const context = priorities.map(p => ({
      id: p.id, title: p.title,
      priority_level: p.priority_level,
      due_date: p.due_date || null,
      days_left: getDaysLeft(p.due_date),
      task_count: (p.tasks || []).length,
      incomplete_tasks: (p.tasks || []).filter(t => !t.done).length
    }));
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are helping a user plan their day. 
Daily focus: "${focusToday || "not set"}".
Priorities: ${JSON.stringify(context)}

Recommend which priorities they should focus on today. For each recommendation include:
- id (from the list)
- rationale (1-2 sentences max: mention urgency, level, relevance to focus)
- urgency_score (1-10)

Return 3-5 top recommendations sorted by urgency_score descending.`,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                rationale: { type: "string" },
                urgency_score: { type: "number" }
              }
            }
          }
        }
      }
    });
    setRecommendations(result.recommendations || []);
    // Pre-select top recommendations
    const topIds = new Set((result.recommendations || []).slice(0, 3).map(r => r.id));
    setSelected(topIds);
    setLoading(false);
  };

  React.useEffect(() => { analyze(); }, []);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const recMap = Object.fromEntries((recommendations || []).map(r => [r.id, r]));
  const allPriorities = priorities.map(p => ({ ...p, rec: recMap[p.id] || null }));
  const recommended = allPriorities.filter(p => p.rec).sort((a, b) => (b.rec.urgency_score || 0) - (a.rec.urgency_score || 0));
  const others = allPriorities.filter(p => !p.rec);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Here's what I'd suggest focusing on today:</p>
        {focusToday && <p className="text-xs text-muted-foreground mt-0.5">Based on your focus: <em>"{focusToday}"</em></p>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Analyzing your priorities…</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {recommended.map(p => (
            <label key={p.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selected.has(p.id) ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="mt-0.5 accent-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{p.title}</span>
                  <span className={`text-xs font-medium ${LEVEL_COLOR[p.priority_level] || "text-muted-foreground"}`}>{p.priority_level}</span>
                  {p.due_date && <span className="text-xs text-muted-foreground">{getDaysLeft(p.due_date) <= 0 ? "Overdue" : `${getDaysLeft(p.due_date)}d left`}</span>}
                </div>
                {p.rec?.rationale && <p className="text-xs text-muted-foreground mt-0.5">{p.rec.rationale}</p>}
              </div>
            </label>
          ))}
          {others.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground pt-1">Other priorities:</p>
              {others.map(p => (
                <label key={p.id} className={`flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${selected.has(p.id) ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="mt-0.5 accent-primary" />
                  <span className="text-sm text-foreground flex-1">{p.title}</span>
                  <span className={`text-xs ${LEVEL_COLOR[p.priority_level] || ""}`}>{p.priority_level}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => onNext(priorities.filter(p => selected.has(p.id)))} disabled={selected.size === 0 || loading}>
          Continue <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Not now</Button>
      </div>
    </div>
  );
}

// Step 2 — Rank priorities
function StepRank({ selected, onNext, onClose }) {
  const [ranked, setRanked] = useState([...selected]);
  const [aiRanking, setAiRanking] = useState(false);
  const [loading, setLoading] = useState(false);

  const moveUp = (idx) => {
    if (idx === 0) return;
    const next = [...ranked];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setRanked(next);
  };
  const moveDown = (idx) => {
    if (idx === ranked.length - 1) return;
    const next = [...ranked];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    setRanked(next);
  };

  const doAiRank = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Rank these priorities by importance and urgency. Return the ids in order from most to least important.
Priorities: ${JSON.stringify(selected.map(p => ({ id: p.id, title: p.title, priority_level: p.priority_level, days_left: getDaysLeft(p.due_date), incomplete_tasks: (p.tasks||[]).filter(t=>!t.done).length })))}`,
      response_json_schema: { type: "object", properties: { ranked_ids: { type: "array", items: { type: "string" } } } }
    });
    const ids = result.ranked_ids || [];
    const map = Object.fromEntries(selected.map(p => [p.id, p]));
    const reordered = ids.map(id => map[id]).filter(Boolean);
    const rest = selected.filter(p => !ids.includes(p.id));
    setRanked([...reordered, ...rest]);
    setLoading(false);
    setAiRanking(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Rank your selected priorities</p>
        <p className="text-xs text-muted-foreground mt-0.5">Drag or use arrows to reorder, or let me rank them for you.</p>
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {ranked.map((p, idx) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{idx + 1}</span>
            <span className="flex-1 text-sm text-foreground">{p.title}</span>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronRight className="w-3 h-3 -rotate-90" /></button>
              <button onClick={() => moveDown(idx)} disabled={idx === ranked.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronRight className="w-3 h-3 rotate-90" /></button>
            </div>
          </div>
        ))}
      </div>

      {aiRanking ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={doAiRank} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            Yes, rank for me
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAiRanking(false)}>I'll do it</Button>
        </div>
      ) : (
        <div className="flex gap-2 pt-1 flex-wrap">
          <Button size="sm" onClick={() => onNext(ranked)}>
            Continue <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAiRanking(true)}>
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" /> AI rank for me
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      )}
    </div>
  );
}

// Step 3 — Select / add tasks
function StepTasks({ ranked, onNext, onClose }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [selected, setSelected] = useState(() => {
    const init = {};
    ranked.forEach(p => {
      init[p.id] = new Set((p.tasks || []).filter(t => !t.done).map(t => t.id));
    });
    return init;
  });
  const [extras, setExtras] = useState({});
  const [extraInputs, setExtraInputs] = useState({});

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `For each of these priorities, suggest 2-3 concrete actionable tasks that aren't already listed.
Priorities: ${JSON.stringify(ranked.map(p => ({ id: p.id, title: p.title, existing_tasks: (p.tasks||[]).map(t=>t.text) })))}
Return suggestions grouped by priority id.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority_id: { type: "string" },
                  tasks: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });
      const map = {};
      (result.suggestions || []).forEach(s => { map[s.priority_id] = (s.tasks || []).map(text => ({ id: nanoid(), text, suggested: true })); });
      setSuggestions(map);
      setLoading(false);
    })();
  }, []);

  const toggleTask = (pid, tid) => {
    setSelected(prev => {
      const next = { ...prev, [pid]: new Set(prev[pid] || []) };
      next[pid].has(tid) ? next[pid].delete(tid) : next[pid].add(tid);
      return next;
    });
  };
  const addExtra = (pid) => {
    const text = (extraInputs[pid] || "").trim();
    if (!text) return;
    const t = { id: nanoid(), text };
    setExtras(prev => ({ ...prev, [pid]: [...(prev[pid] || []), t] }));
    setSelected(prev => ({ ...prev, [pid]: new Set([...(prev[pid] || []), t.id]) }));
    setExtraInputs(prev => ({ ...prev, [pid]: "" }));
  };

  const buildSelection = () => ranked.map(p => ({
    ...p,
    selected_tasks: [
      ...(p.tasks || []).filter(t => (selected[p.id] || new Set()).has(t.id)),
      ...(suggestions[p.id] || []).filter(t => (selected[p.id] || new Set()).has(t.id)),
      ...(extras[p.id] || []).filter(t => (selected[p.id] || new Set()).has(t.id))
    ]
  }));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Which tasks need to get done?</p>
        <p className="text-xs text-muted-foreground mt-0.5">Select existing tasks, pick suggestions, or add your own.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Getting task suggestions…</span>
        </div>
      ) : (
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
          {ranked.map((p, idx) => {
            const existingIncomplete = (p.tasks || []).filter(t => !t.done);
            const sugg = suggestions[p.id] || [];
            const ext = extras[p.id] || [];
            return (
              <div key={p.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">{idx + 1}.</span>
                  <Flag className={`w-3.5 h-3.5 shrink-0 ${LEVEL_COLOR[p.priority_level] || ""}`} />
                  <span className="text-sm font-semibold text-foreground">{p.title}</span>
                </div>
                <div className="pl-5 space-y-1.5">
                  {existingIncomplete.map(t => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(selected[p.id] || new Set()).has(t.id)} onChange={() => toggleTask(p.id, t.id)} className="accent-primary" />
                      <span className="text-sm text-foreground">{t.text}</span>
                    </label>
                  ))}
                  {sugg.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground pt-1 italic">Suggested:</p>
                      {sugg.map(t => (
                        <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(selected[p.id] || new Set()).has(t.id)} onChange={() => toggleTask(p.id, t.id)} className="accent-primary" />
                          <span className="text-sm text-muted-foreground">{t.text}</span>
                        </label>
                      ))}
                    </>
                  )}
                  {ext.map(t => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(selected[p.id] || new Set()).has(t.id)} onChange={() => toggleTask(p.id, t.id)} className="accent-primary" />
                      <span className="text-sm text-foreground">{t.text}</span>
                    </label>
                  ))}
                  <div className="flex gap-1 pt-1">
                    <Input placeholder="Add a task…" value={extraInputs[p.id] || ""} onChange={e => setExtraInputs(prev => ({ ...prev, [p.id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addExtra(p.id)} className="h-7 text-xs flex-1" />
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => addExtra(p.id)}><Plus className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => onNext(buildSelection())} disabled={loading}>
          Continue <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

// Step 4 — Plan or just compile
function StepPlan({ rankedWithTasks, focusToday, onDone, onClose }) {
  const [wantPlan, setWantPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (detailed) => {
    setLoading(true);
    const prompt = detailed
      ? `Create a detailed, step-by-step daily plan. Break tasks into small manageable steps. Keep it encouraging and clear. 
Focus: "${focusToday || "not set"}"
Priorities and tasks: ${JSON.stringify(rankedWithTasks.map((p, i) => ({ rank: i + 1, title: p.title, level: p.priority_level, tasks: p.selected_tasks.map(t => t.text) })))}

Format the plan using:
- ### headers for each priority section
- **bold** for key actions and important notes  
- ✓ checkboxes for individual tasks (use: ✓ task text on its own line)
- Bullet points (- item) for supporting details
- Clear spacing between sections with blank lines

Return a structured plan with sections per priority, sub-steps, and brief motivational notes.`
      : `Compile an organized summary of what needs to be accomplished today.
Priorities and tasks: ${JSON.stringify(rankedWithTasks.map((p, i) => ({ rank: i + 1, title: p.title, level: p.priority_level, tasks: p.selected_tasks.map(t => t.text) })))}
Keep it brief, clear and actionable.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });

    const plan = {
      id: nanoid(),
      created_at: new Date().toISOString(),
      focus: focusToday || "",
      detailed,
      ai_plan: result,
      priorities: rankedWithTasks.map((p, i) => ({
        id: p.id, title: p.title, rank: i + 1, priority_level: p.priority_level,
        done: false, struggling: false,
        tasks: p.selected_tasks.map(t => ({ id: t.id, text: t.text, done: false, struggling: false }))
      }))
    };
    setLoading(false);
    onDone(plan);
  };

  useEffect(() => {
    if (wantPlan !== null && !loading) {
      generate(wantPlan);
    }
  }, [wantPlan, loading, generate, rankedWithTasks, focusToday, onDone]);

  if (wantPlan === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-foreground">Would you like me to put together a plan?</p>
        <p className="text-xs text-muted-foreground">A plan breaks things into steps and gives you a roadmap. Or I can just compile everything neatly.</p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => setWantPlan(true)}><Sparkles className="w-3.5 h-3.5 mr-1" /> Yes, make a plan</Button>
          <Button size="sm" variant="outline" onClick={() => setWantPlan(false)}>Just compile it</Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">{wantPlan ? "Building your plan…" : "Compiling…"}</span>
    </div>
  );
}

// ---- Main Wizard ----
export default function PriorityCoach({ priorities, focusToday, onPlanReady, onClose }) {
  const [step, setStep] = useState("recommend"); // recommend | rank | tasks | plan
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [rankedPriorities, setRankedPriorities] = useState([]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-1"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Priority Coach</span>
          <span className="text-xs text-muted-foreground">
            {step === "recommend" && "Step 1 of 4 — Select"}
            {step === "rank" && "Step 2 of 4 — Rank"}
            {step === "tasks" && "Step 3 of 4 — Tasks"}
            {step === "plan" && "Step 4 of 4 — Plan"}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      {step === "recommend" && (
        <StepRecommend
          priorities={priorities}
          focusToday={focusToday}
          onNext={(sel) => { setSelectedPriorities(sel); setStep("rank"); }}
          onClose={onClose}
        />
      )}
      {step === "rank" && (
        <StepRank
          selected={selectedPriorities}
          onNext={(ranked) => { setRankedPriorities(ranked); setStep("tasks"); }}
          onClose={onClose}
        />
      )}
      {step === "tasks" && (
        <StepTasks
          ranked={rankedPriorities}
          onNext={(withTasks) => { setRankedPriorities(withTasks); setStep("plan"); }}
          onClose={onClose}
        />
      )}
      {step === "plan" && (
        <StepPlan
          rankedWithTasks={rankedPriorities}
          focusToday={focusToday}
          onDone={(plan) => { onPlanReady(plan); onClose(); }}
          onClose={onClose}
        />
      )}
    </motion.div>
  );
}