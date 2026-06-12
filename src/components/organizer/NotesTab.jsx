import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Trash2, FileText, LayoutGrid, List, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";

function nanoid() { return Math.random().toString(36).slice(2, 10); }

export default function NotesTab({ notes = [], onChange }) {
  const [draft, setDraft] = useState("");
  const [organizing, setOrganizing] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [expandedId, setExpandedId] = useState(null);

  const organizeAndSave = async () => {
    if (!draft.trim()) return;
    setOrganizing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful assistant for someone who thinks in a disorganized, free-flowing way (like someone with ADHD). 
Take the following brain dump and:
1. Create a clear, concise subject heading (5 words max)
2. Organize the content into a clean, readable format with bullet points or numbered steps where relevant. Keep the voice casual and human.

Return JSON with: { "subject": "...", "formatted": "..." }

Brain dump:
${draft}`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            formatted: { type: "string" }
          }
        }
      });
      onChange([{ id: nanoid(), raw_entry: draft.trim(), subject: result.subject || "Untitled Note", formatted: result.formatted || draft.trim(), created_at: new Date().toISOString() }, ...notes]);
      setDraft("");
    } catch (e) {
      onChange([{ id: nanoid(), raw_entry: draft.trim(), subject: draft.trim().split(" ").slice(0, 5).join(" "), formatted: draft.trim(), created_at: new Date().toISOString() }, ...notes]);
      setDraft("");
    } finally {
      setOrganizing(false);
    }
  };

  const remove = (id) => onChange(notes.filter(n => n.id !== id));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Just start typing... dump everything on your mind. No structure needed. Ideas, fragments, lists, stream of consciousness — it all works. We'll organize it for you ✨"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="resize-none min-h-[160px] text-sm leading-relaxed"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">AI will organize this into a clean note with a subject heading</span>
          <Button size="sm" onClick={organizeAndSave} disabled={!draft.trim() || organizing}>
            {organizing ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Organizing...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Organize & Save</>}
          </Button>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saved Notes ({notes.length})</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setViewMode("list")} className={`p-1 rounded transition-colors ${viewMode === "list" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}><List className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode("card")} className={`p-1 rounded transition-colors ${viewMode === "card" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence>
                {notes.map(note => (
                  <motion.div key={note.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}>
                      <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="flex-1 text-sm font-medium text-foreground truncate">{note.subject}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{note.created_at && formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
                      {expandedId === note.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <AnimatePresence>
                      {expandedId === note.id && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-3 pb-3 space-y-2 border-t border-border">
                            <p className="text-sm text-foreground whitespace-pre-wrap pt-2">{note.formatted}</p>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Original entry</summary>
                              <p className="mt-1 text-muted-foreground whitespace-pre-wrap bg-muted/40 rounded p-2">{note.raw_entry}</p>
                            </details>
                            <button onClick={() => remove(note.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {notes.map(note => (
                <div key={note.id} className="rounded-lg border border-border bg-card p-3 space-y-1.5 group">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-sm font-medium text-foreground leading-tight">{note.subject}</span>
                    <button onClick={() => remove(note.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{note.formatted}</p>
                  <span className="text-xs text-muted-foreground/70">{note.created_at && formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}