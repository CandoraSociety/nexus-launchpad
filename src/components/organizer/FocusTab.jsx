import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Target, RefreshCw, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function FocusTab({ focusToday, focusDate, onChange, notes = [], tasks = [], priorities = [] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(focusToday || "");
  const [finding, setFinding] = useState(false);
  const [relevant, setRelevant] = useState(null);
  const [showRelevant, setShowRelevant] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const isToday = focusDate === today;

  const save = () => { onChange({ focus_today: draft.trim(), focus_date: today }); setEditing(false); setRelevant(null); };
  const reset = () => { setDraft(""); onChange({ focus_today: "", focus_date: today }); setEditing(true); setRelevant(null); };

  const findRelevant = async (focusText) => {
    const text = focusText || draft;
    if (!text.trim()) return;
    setFinding(true);
    try {
      const allContext = {
        notes: notes.map(n => ({ id: n.id, subject: n.subject, preview: n.formatted?.substring(0, 100) })),
        tasks: tasks.filter(t => !t.done).map(t => ({ id: t.id, text: t.text })),
        priorities: priorities.map(p => ({ id: p.id, title: p.title, due_date: p.due_date, priority_level: p.priority_level }))
      };
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Given this daily focus: "${text}"\n\nContext:\nNotes: ${JSON.stringify(allContext.notes)}\nTasks: ${JSON.stringify(allContext.tasks)}\nPriorities: ${JSON.stringify(allContext.priorities)}\n\nFind relevant items. Return JSON: { "relevant": [{ "type": "note|task|priority", "id": "...", "label": "short label" }] }`,
        response_json_schema: { type: "object", properties: { relevant: { type: "array", items: { type: "object", properties: { type: { type: "string" }, id: { type: "string" }, label: { type: "string" } } } } } }
      });
      setRelevant(result.relevant || []);
      setShowRelevant(true);
    } catch (e) {
      setRelevant([]);
    } finally {
      setFinding(false);
    }
  };

  const noFocus = !isToday || !focusToday;

  return (
    <div className="space-y-3">
      {noFocus ? (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">What's your focus for today?</span>
          </div>
          <Textarea placeholder="e.g. Finish the Q2 report, follow up with the design team, and actually eat lunch..." value={draft} onChange={e => setDraft(e.target.value)} className="resize-none min-h-[80px] text-sm" />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={!draft.trim()}><Target className="w-3.5 h-3.5 mr-1.5" /> Set Focus</Button>
            {draft.trim() && (notes.length > 0 || tasks.length > 0 || priorities.length > 0) && (
              <Button size="sm" variant="outline" onClick={() => findRelevant()} disabled={finding}>
                {finding ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />} Find related
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Target className="w-4 h-4 text-primary" /> Today's Focus</div>
            <div className="flex gap-1">
              {(notes.length > 0 || tasks.length > 0 || priorities.length > 0) && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => findRelevant(focusToday)} disabled={finding}>
                  {finding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Related
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={reset}><RefreshCw className="w-3 h-3 mr-1" /> Reset</Button>
            </div>
          </div>
          {editing ? (
            <div className="space-y-2">
              <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="resize-none min-h-[80px] text-sm" />
              <Button size="sm" onClick={save} disabled={!draft.trim()}>Save</Button>
            </div>
          ) : (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-foreground cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => { setDraft(focusToday); setEditing(true); }}>
              {focusToday}
              <p className="text-xs text-muted-foreground mt-1">Click to edit</p>
            </div>
          )}
        </>
      )}
      {relevant !== null && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <button className="flex items-center justify-between w-full text-xs font-medium text-foreground" onClick={() => setShowRelevant(v => !v)}>
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" />{relevant.length > 0 ? `${relevant.length} related item${relevant.length !== 1 ? "s" : ""} found` : "No related items found"}</span>
            {showRelevant ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showRelevant && relevant.length > 0 && (
            <div className="space-y-1">
              {relevant.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                  <span className="text-muted-foreground capitalize w-12 shrink-0">{item.type}</span>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}