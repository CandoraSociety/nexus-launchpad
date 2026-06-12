import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Flag, AlertTriangle } from "lucide-react";
import { differenceInDays, parseISO, isValid } from "date-fns";

function getWeightedItems(notes, priorities) {
  const items = [];
  notes.forEach(n => items.push({ type: "note", label: n.subject, id: n.id }));
  priorities.forEach(p => {
    let weight = 1;
    if (p.priority_level === "critical") weight = 4;
    else if (p.priority_level === "high") weight = 3;
    else if (p.priority_level === "medium") weight = 2;
    if (p.due_date && isValid(parseISO(p.due_date))) {
      const days = differenceInDays(parseISO(p.due_date), new Date());
      if (days <= 1) weight += 4;
      else if (days <= 3) weight += 3;
      else if (days <= 7) weight += 2;
    }
    const urgent = weight >= 5;
    for (let i = 0; i < weight; i++) {
      items.push({ type: "priority", label: p.title, id: `${p.id}_${i}`, urgent });
    }
  });
  return items;
}

export default function TickerBar({ notes = [], priorities = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const weighted = getWeightedItems(notes, priorities);
    setItems([...weighted].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
  }, [notes.length, priorities.length]);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => setCurrentIndex(i => (i + 1) % items.length), 4000);
    return () => clearInterval(interval);
  }, [items]);

  if (items.length === 0) return null;
  const current = items[currentIndex];
  if (!current) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border overflow-hidden min-w-0">
      <div className="shrink-0">
        {current.type === "note" ? <FileText className="w-3.5 h-3.5 text-primary" />
          : current.urgent ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          : <Flag className="w-3.5 h-3.5 text-orange-500" />}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-xs text-foreground truncate flex-1"
        >
          {current.type === "priority" ? "📌 " : "📝 "}{current.label}
        </motion.span>
      </AnimatePresence>
      <span className="text-xs text-muted-foreground shrink-0">{currentIndex + 1}/{items.length}</span>
    </div>
  );
}