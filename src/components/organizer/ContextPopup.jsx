import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContextPopup({ notes = [], priorities = [] }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastShownRef = useRef(0);
  const activityCountRef = useRef(0);

  useEffect(() => {
    if (notes.length === 0 && priorities.length === 0) return;
    const handleActivity = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isInputLike = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (!isInputLike) return;
      activityCountRef.current += 1;
      if (activityCountRef.current >= 3) {
        const now = Date.now();
        if (now - lastShownRef.current > 3 * 60 * 1000) {
          lastShownRef.current = now;
          activityCountRef.current = 0;
          setDismissed(false);
          setVisible(true);
          setTimeout(() => setVisible(false), 12000);
        }
      }
    };
    window.addEventListener("keydown", handleActivity);
    return () => window.removeEventListener("keydown", handleActivity);
  }, [notes.length, priorities.length]);

  const total = notes.length + priorities.length;

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50 max-w-xs w-full"
        >
          <div className="rounded-xl border border-border bg-card shadow-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">Are these notes relevant?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have {total} saved item{total !== 1 ? "s" : ""} in your organizer that might relate to what you're working on.
                </p>
              </div>
              <button onClick={() => { setDismissed(true); setVisible(false); }} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => { setDismissed(true); setVisible(false); }}>
                <Check className="w-3 h-3 mr-1" /> Got it
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={() => { setDismissed(true); setVisible(false); }}>
                Not relevant
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}