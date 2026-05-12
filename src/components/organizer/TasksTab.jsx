import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "https://esm.sh/nanoid@5.0.7";

export default function TasksTab({ tasks = [], onChange }) {
  const [input, setInput] = useState("");

  const addTask = () => {
    if (!input.trim()) return;
    onChange([...tasks, { id: nanoid(8), text: input.trim(), done: false, created_at: new Date().toISOString() }]);
    setInput("");
  };

  const toggleTask = (id) => {
    onChange(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    onChange(tasks.filter(t => t.id !== id));
  };

  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a task..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTask()}
          className="flex-1"
        />
        <Button size="sm" onClick={addTask} disabled={!input.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        <AnimatePresence>
          {pending.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center gap-2 group"
            >
              <button onClick={() => toggleTask(task.id)} className="text-muted-foreground hover:text-primary transition-colors">
                <Circle className="w-4 h-4" />
              </button>
              <span className="flex-1 text-sm text-foreground">{task.text}</span>
              <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {done.length > 0 && (
          <div className="pt-2 border-t border-border/50 space-y-1.5">
            {done.map(task => (
              <div key={task.id} className="flex items-center gap-2 group">
                <button onClick={() => toggleTask(task.id)} className="text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <span className="flex-1 text-sm text-muted-foreground line-through">{task.text}</span>
                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No tasks yet — add something above!</p>
        )}
      </div>

      {pending.length > 0 && (
        <p className="text-xs text-muted-foreground">{pending.length} task{pending.length !== 1 ? "s" : ""} remaining</p>
      )}
    </div>
  );
}