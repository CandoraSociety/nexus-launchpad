import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Target, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function FocusTab({ focusToday, focusDate, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(focusToday || "");

  const today = format(new Date(), "yyyy-MM-dd");
  const isToday = focusDate === today;

  const save = () => {
    onChange({ focus_today: draft.trim(), focus_date: today });
    setEditing(false);
  };

  const reset = () => {
    setDraft("");
    onChange({ focus_today: "", focus_date: today });
    setEditing(true);
  };

  if (!isToday || !focusToday) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">What's your focus for today?</span>
        </div>
        <Textarea
          placeholder="e.g. Finish the Q2 report, follow up with the design team, and actually eat lunch..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="resize-none min-h-[80px] text-sm"
        />
        <Button size="sm" onClick={save} disabled={!draft.trim()}>
          <Target className="w-3.5 h-3.5 mr-1.5" /> Set Today's Focus
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Target className="w-4 h-4 text-primary" />
          Today's Focus
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={reset}>
          <RefreshCw className="w-3 h-3 mr-1" /> Reset
        </Button>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="resize-none min-h-[80px] text-sm"
          />
          <Button size="sm" onClick={save} disabled={!draft.trim()}>Save</Button>
        </div>
      ) : (
        <div
          className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-foreground cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => { setDraft(focusToday); setEditing(true); }}
        >
          {focusToday}
          <p className="text-xs text-muted-foreground mt-1">Click to edit</p>
        </div>
      )}
    </div>
  );
}