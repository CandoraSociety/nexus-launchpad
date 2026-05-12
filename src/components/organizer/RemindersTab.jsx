import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Bell, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "https://esm.sh/nanoid@5.0.7";
import { formatDistanceToNow } from "date-fns";

export default function RemindersTab({ reminders = [], onChange }) {
  const [input, setInput] = useState("");

  const add = () => {
    if (!input.trim()) return;
    onChange([...reminders, { id: nanoid(8), text: input.trim(), nudge_count: 0, last_nudged: null }]);
    setInput("");
  };

  const nudge = (id) => {
    onChange(reminders.map(r =>
      r.id === id
        ? { ...r, nudge_count: (r.nudge_count || 0) + 1, last_nudged: new Date().toISOString() }
        : r
    ));
  };

  const remove = (id) => onChange(reminders.filter(r => r.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Something you keep forgetting..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          className="flex-1"
        />
        <Button size="sm" onClick={add} disabled={!input.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        <AnimatePresence>
          {reminders.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-start gap-2 group rounded-lg border border-border bg-card p-2.5"
            >
              <Bell className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{r.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  {r.nudge_count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Nudged {r.nudge_count}x
                      {r.last_nudged && ` · ${formatDistanceToNow(new Date(r.last_nudged), { addSuffix: true })}`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => nudge(r.id)}
                  title="Nudge me again"
                  className="text-amber-500 hover:text-amber-600"
                >
                  <BellRing className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {reminders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nothing to remind yourself of yet!</p>
        )}
      </div>
    </div>
  );
}