import React, { useEffect, useRef } from "react";
import { differenceInDays, parseISO, isValid } from "date-fns";

export default function PriorityDeadlineNotifier({ priorities = [] }) {
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    if (!("Notification" in window) || priorities.length === 0) return;
    const check = () => {
      priorities.forEach(p => {
        if (!p.due_date || !isValid(parseISO(p.due_date))) return;
        const days = differenceInDays(parseISO(p.due_date), new Date());
        [0, 1, 3].forEach(threshold => {
          const key = `${p.id}_${threshold}`;
          if (days === threshold && !notifiedRef.current.has(key)) {
            notifiedRef.current.add(key);
            const label = days === 0 ? "is due TODAY" : days === 1 ? "is due TOMORROW" : "is due in 3 days";
            const notify = () => new Notification(`⚑ Priority: ${p.title}`, { body: `This priority ${label}.` });
            if (Notification.permission === "granted") notify();
            else if (Notification.permission !== "denied") Notification.requestPermission().then(perm => { if (perm === "granted") notify(); });
          }
        });
      });
    };
    check();
    const interval = setInterval(check, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [priorities]);

  return null;
}