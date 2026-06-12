import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, ChevronUp, Flag, Calendar, CheckCircle2, Circle, LayoutGrid, List, Pencil, Check, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, isPast, isValid, parseISO } from "date-fns";
import PriorityCoach from "./PriorityCoach";

function nanoid() { return Math.random().toString(36).slice(2, 10); }

const PRIORITY_LEVELS = [
  { value: "critical", label: "Critical", color: "text-red-500", bg: "bg-red-50 border-red-200" },
  { value: "high", label: "High", color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
  { value: "medium", label: "Medium", color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
  { value: "low", label: "Low", color: "text-green-500", bg: "bg-green-50 border-green-200" },
];

function DaysIndicator({ due_date }) {
  if (!due_date) return null;
  const date = parseISO(due_date);
  if (!isValid(date)) return null;
  const days = differenceInDays(date, new Date());
  if (isPast(date) && days < 0) return <span className="text-xs text-red-500 font-medium">Overdue!</span>;
  if (days === 0) return <span className="text-xs text-red-500 font-medium">Due today!</span>;
  if (days <= 3) return <span className="text-xs text-orange-500 font-medium">{days}d left</span>;
  return <span className="text-xs text-muted-foreground">{days}d left</span>;
}

function AddPriorityForm({ onAdd, onCancel }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [level, setLevel] = useState("medium");
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState([]);

  const addTask = () => {
    if (!taskInput.trim()) return;
    setTasks(prev => [...prev, { id: nanoid(), text: taskInput.trim(), done: false }]);
    setTaskInput("");
  };

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ id: nanoid(), title: title.trim(), due_date: dueDate || null, priority_level: level, tasks, created_at: new Date().toISOString() });
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">New Priority</p>
      <Input placeholder="What needs to get done?" value={title} onChange={e => setTitle(e.target.value)} className="text-sm" autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Due date (optional)</label>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-sm h-8" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Priority level</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full h-8 text-sm rounded-md border border-input bg-background px-2">
            {PRIORITY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Tasks needed (optional)</label>
        <div className="flex gap-2">
          <Input placeholder="Add a task..." value={taskInput} onChange={e => setTaskInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} className="flex-1 text-sm h-8" />
          <Button size="sm" variant="outline" onClick={addTask} className="h-8 px-2"><Plus className="w-3.5 h-3.5" /></Button>
        </div>
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Circle className="w-3 h-3" /><span className="flex-1">{t.text}</span>
            <button onClick={() => setTasks(prev => prev.filter(x => x.id !== t.id))} className="hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!title.trim()}><Flag className="w-3.5 h-3.5 mr-1.5" /> Add Priority</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function PriorityItem({ priority, onUpdate, onDelete, viewMode }) {
  const [expanded, setExpanded] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(priority.title);
  const [editDate, setEditDate] = useState(priority.due_date || "");
  const [editLevel, setEditLevel] = useState(priority.priority_level || "medium");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const levelInfo = PRIORITY_LEVELS.find(l => l.value === priority.priority_level) || PRIORITY_LEVELS[2];

  const toggleTask = (taskId) => onUpdate({ ...priority, tasks: (priority.tasks || []).map(t => t.id === taskId ? { ...t, done: !t.done } : t) });
  const addTask = () => {
    if (!newTask.trim()) return;
    onUpdate({ ...priority, tasks: [...(priority.tasks || []), { id: nanoid(), text: newTask.trim(), done: false }] });
    setNewTask(""); setAddingTask(false);
  };
  const deleteTask = (taskId) => onUpdate({ ...priority, tasks: (priority.tasks || []).filter(t => t.id !== taskId) });
  const saveTaskEdit = (taskId) => {
    if (!editingTaskText.trim()) return;
    onUpdate({ ...priority, tasks: (priority.tasks || []).map(t => t.id === taskId ? { ...t, text: editingTaskText.trim() } : t) });
    setEditingTaskId(null);
  };
  const saveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate({ ...priority, title: editTitle.trim(), due_date: editDate || null, priority_level: editLevel });
    setEditing(false);
  };

  const completedTasks = (priority.tasks || []).filter(t => t.done).length;
  const totalTasks = (priority.tasks || []).length;

  if (viewMode === "card") {
    return (
      <div className={`rounded-xl border p-3 space-y-2 ${levelInfo.bg}`}>
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">{priority.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-medium ${levelInfo.color}`}>{levelInfo.label}</span>
              {priority.due_date && isValid(parseISO(priority.due_date)) && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Calendar className="w-3 h-3" />{format(parseISO(priority.due_date), "MMM d")}</span>}
              <DaysIndicator due_date={priority.due_date} />
            </div>
          </div>
          <button onClick={() => onDelete(priority.id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
        {totalTasks > 0 && <div className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks done</div>}
        {(priority.tasks || []).map(t => (
          <div key={t.id} className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleTask(t.id)}>
            {t.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className={`text-xs ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.text}</span>
          </div>
        ))}
        <button onClick={() => setAddingTask(true)} className="text-xs text-primary flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> Add task</button>
        {addingTask && (
          <div className="flex gap-1">
            <Input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Task..." className="h-7 text-xs flex-1" autoFocus />
            <Button size="sm" className="h-7 px-2" onClick={addTask}><Plus className="w-3 h-3" /></Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpanded(v => !v)}>
        <Flag className={`w-3.5 h-3.5 shrink-0 ${levelInfo.color}`} />
        <span className="flex-1 text-sm font-medium text-foreground truncate">{priority.title}</span>
        <div className="flex items-center gap-2 shrink-0">
          {priority.due_date && isValid(parseISO(priority.due_date)) && <span className="text-xs text-muted-foreground hidden sm:block">{format(parseISO(priority.due_date), "MMM d")}</span>}
          <DaysIndicator due_date={priority.due_date} />
          {totalTasks > 0 && <span className="text-xs text-muted-foreground">{completedTasks}/{totalTasks}</span>}
          <button onClick={e => { e.stopPropagation(); setEditTitle(priority.title); setEditDate(priority.due_date || ""); setEditLevel(priority.priority_level || "medium"); setEditing(true); setExpanded(true); }} className="text-muted-foreground hover:text-primary p-0.5 rounded transition-colors"><Pencil className="w-3 h-3" /></button>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 border-t border-border space-y-2 pt-2">
              {editing ? (
                <div className="space-y-2">
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-sm h-8" autoFocus />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="text-sm h-8" />
                    <select value={editLevel} onChange={e => setEditLevel(e.target.value)} className="w-full h-8 text-sm rounded-md border border-input bg-background px-2">
                      {PRIORITY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={!editTitle.trim()} className="h-7 px-2.5 text-xs"><Check className="w-3 h-3 mr-1" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 px-2.5 text-xs"><X className="w-3 h-3 mr-1" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={`font-medium ${levelInfo.color}`}>{levelInfo.label} priority</span>
                  {priority.due_date && isValid(parseISO(priority.due_date)) && <span>Due: {format(parseISO(priority.due_date), "MMMM d, yyyy")}</span>}
                </div>
              )}
              {(priority.tasks || []).map(t => (
                <div key={t.id} className="flex items-center gap-2 group/task">
                  <div className="cursor-pointer" onClick={() => toggleTask(t.id)}>
                    {t.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  {editingTaskId === t.id ? (
                    <>
                      <Input value={editingTaskText} onChange={e => setEditingTaskText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveTaskEdit(t.id); if (e.key === "Escape") setEditingTaskId(null); }} className="h-6 text-xs flex-1" autoFocus />
                      <button onClick={() => saveTaskEdit(t.id)} className="text-primary hover:text-primary/80"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingTaskId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.text}</span>
                      <button onClick={() => { setEditingTaskId(t.id); setEditingTaskText(t.text); }} className="opacity-0 group-hover/task:opacity-100 text-muted-foreground hover:text-primary transition-opacity"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover/task:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    </>
                  )}
                </div>
              ))}
              {addingTask ? (
                <div className="flex gap-2">
                  <Input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="New task..." className="h-7 text-xs flex-1" autoFocus />
                  <Button size="sm" className="h-7 px-2" onClick={addTask}><Plus className="w-3 h-3" /></Button>
                </div>
              ) : (
                <button onClick={() => setAddingTask(true)} className="text-xs text-primary flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> Add task</button>
              )}
              <button onClick={() => onDelete(priority.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"><Trash2 className="w-3 h-3" /> Remove</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PrioritiesTab({ priorities = [], onChange, focusToday, onPlanReady }) {
  const [adding, setAdding] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [coaching, setCoaching] = useState(false);

  const add = (p) => { onChange([p, ...priorities]); setAdding(false); };
  const update = (updated) => onChange(priorities.map(p => p.id === updated.id ? updated : p));
  const remove = (id) => onChange(priorities.filter(p => p.id !== id));

  const sorted = [...priorities].sort((a, b) => {
    const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const diff = (levelOrder[a.priority_level] ?? 2) - (levelOrder[b.priority_level] ?? 2);
    if (diff !== 0) return diff;
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{priorities.length} priorit{priorities.length !== 1 ? "ies" : "y"}</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => setViewMode("list")} className={`p-1 rounded transition-colors ${viewMode === "list" ? "text-primary bg-primary/10" : "text-muted-foreground"}`}><List className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode("card")} className={`p-1 rounded transition-colors ${viewMode === "card" ? "text-primary bg-primary/10" : "text-muted-foreground"}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
          </div>
          <Button size="sm" onClick={() => setAdding(true)} className="h-7 px-2.5 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
        </div>
      </div>
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AddPriorityForm onAdd={add} onCancel={() => setAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      {sorted.length === 0 && !adding && <p className="text-sm text-muted-foreground text-center py-6">No priorities yet. Add something that needs your attention!</p>}
      <div className={viewMode === "card" ? "grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1" : "space-y-1.5 max-h-72 overflow-y-auto pr-1"}>
        {sorted.map(p => <PriorityItem key={p.id} priority={p} onUpdate={update} onDelete={remove} viewMode={viewMode} />)}
      </div>

      <AnimatePresence>
        {coaching && (
          <PriorityCoach
            priorities={priorities}
            focusToday={focusToday}
            onPlanReady={onPlanReady}
            onClose={() => setCoaching(false)}
          />
        )}
      </AnimatePresence>

      {!coaching && priorities.length > 0 && (
        <button
          onClick={() => setCoaching(true)}
          className="w-full mt-1 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors py-3 px-4 flex items-center justify-center gap-2 text-sm text-primary font-medium"
        >
          <Sparkles className="w-4 h-4" />
          Can I help you with your priorities today?
        </button>
      )}
    </div>
  );
}