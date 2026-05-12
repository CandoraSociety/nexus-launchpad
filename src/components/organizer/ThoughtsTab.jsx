import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Lightbulb, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "https://esm.sh/nanoid@5.0.7";
import { formatDistanceToNow } from "date-fns";

// Auto-tag a thought using simple keyword detection
function autoTag(text) {
  const t = text.toLowerCase();
  if (t.includes("idea") || t.includes("what if") || t.includes("could we")) return "💡 Idea";
  if (t.includes("bug") || t.includes("broken") || t.includes("fix") || t.includes("issue")) return "🐛 Issue";
  if (t.includes("ask") || t.includes("question") || t.includes("why") || t.includes("how")) return "❓ Question";
  if (t.includes("meeting") || t.includes("call") || t.includes("sync")) return "📅 Meeting";
  return "🧠 Thought";
}

export default function ThoughtsTab({ thoughts = [], onChange }) {
  const [input, setInput] = useState("");

  const add = () => {
    if (!input.trim()) return;
    onChange([
      { id: nanoid(8), text: input.trim(), tag: autoTag(input), created_at: new Date().toISOString() },
      ...thoughts,
    ]);
    setInput("");
  };

  const remove = (id) => onChange(thoughts.filter(t => t.id !== id));

  // Group by tag
  const grouped = thoughts.reduce((acc, t) => {
    const tag = t.tag || "🧠 Thought";
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Random thought, idea, question, or anything your brain just threw at you..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="resize-none min-h-[60px] text-sm"
          onKeyDown={e => e.key === "Enter" && e.metaKey && add()}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Auto-tagged by content ✨</span>
          <Button size="sm" onClick={add} disabled={!input.trim()}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Capture
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {thoughts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Brain empty? Capture a thought above!</p>
        )}
        <AnimatePresence>
          {Object.entries(grouped).map(([tag, items]) => (
            <div key={tag}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{tag}</p>
              {items.map(t => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 group mb-1.5 rounded-lg bg-muted/40 px-3 py-2"
                >
                  <p className="flex-1 text-sm text-foreground">{t.text}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {t.created_at && (
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                      </span>
                    )}
                    <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}