# Organization for the Disorganized - Complete Replication Guide

## Overview
A comprehensive personal organization system designed for neurodivergent users with brain-dump notes, priority management, task tracking, focus setting, reminders, and AI-powered daily planning.

---

## 1. Required Packages

Install these packages in your new app:
```bash
# Already included in most Base44 apps:
- framer-motion
- date-fns
- lucide-react
- @tanstack/react-query
- react-markdown

# Need to install:
- nanoid (for unique ID generation)
```

---

## 2. Entity Schema

Create `entities/PersonalOrganizer.json`:

```json
{
  "name": "PersonalOrganizer",
  "type": "object",
  "properties": {
    "user_email": {
      "type": "string",
      "description": "Email of the user this organizer belongs to"
    },
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "text": { "type": "string" },
          "done": { "type": "boolean" },
          "created_at": { "type": "string" }
        }
      },
      "description": "Personal to-do tasks"
    },
    "focus_today": {
      "type": "string",
      "description": "What the user wants to focus on today"
    },
    "focus_date": {
      "type": "string",
      "description": "Date the focus was last set (YYYY-MM-DD)"
    },
    "reminders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "text": { "type": "string" },
          "nudge_count": { "type": "number" },
          "last_nudged": { "type": "string" }
        }
      },
      "description": "Recurring reminders"
    },
    "notes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "raw_entry": { "type": "string" },
          "subject": { "type": "string" },
          "formatted": { "type": "string" },
          "created_at": { "type": "string" }
        }
      },
      "description": "Brain dump notes, AI-organized with subject headings"
    },
    "priorities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "due_date": { "type": "string" },
          "priority_level": { "type": "string" },
          "tasks": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "text": { "type": "string" },
                "done": { "type": "boolean" }
              }
            }
          },
          "created_at": { "type": "string" }
        }
      },
      "description": "Priority catalogue with due dates and sub-tasks"
    },
    "daily_plan": {
      "type": "object",
      "description": "The current AI-generated daily plan",
      "properties": {
        "id": { "type": "string" },
        "created_at": { "type": "string" },
        "focus": { "type": "string" },
        "detailed": { "type": "boolean" },
        "ai_plan": { "type": "string" },
        "priorities": {
          "type": "array",
          "items": { "type": "object" }
        }
      }
    }
  },
  "required": ["user_email"]
}
```

---

## 3. Component Files

Create all these files in `components/organizer/`:

### 3.1 OrganizerPanel.jsx (Main Container)
```jsx
import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Brain, CheckSquare, Target, Bell, FileText, Flag, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TasksTab from "./TasksTab";
import FocusTab from "./FocusTab";
import RemindersTab from "./RemindersTab";
import NotesTab from "./NotesTab";
import PrioritiesTab from "./PrioritiesTab";
import TickerBar from "./TickerBar";
import ContextPopup from "./ContextPopup";
import PriorityDeadlineNotifier from "./PriorityDeadlineNotifier";
import DailyPlan from "./DailyPlan";

export default function OrganizerPanel({ user }) {
  const [collapsed, setCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const { data: records } = useQuery({
    queryKey: ["organizer", user?.email],
    queryFn: () => base44.entities.PersonalOrganizer.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const record = records?.[0];

  const saveMutation = useMutation({
    mutationFn: (data) =>
      record?.id
        ? base44.entities.PersonalOrganizer.update(record.id, data)
        : base44.entities.PersonalOrganizer.create({ user_email: user.email, ...data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizer", user?.email] }),
  });

  const save = useCallback((patch) => {
    saveMutation.mutate(patch);
  }, [record?.id, user?.email]);

  const notes = record?.notes || [];
  const priorities = record?.priorities || [];
  const tasks = record?.tasks || [];
  const reminders = record?.reminders || [];

  const pendingTaskCount = tasks.filter(t => !t.done).length;
  const priorityCount = priorities.length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setCollapsed(v => !v)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground text-sm leading-tight">Organization for the Disorganized</h2>
              <p className="text-xs text-muted-foreground">Your personal chaos management center</p>
            </div>
            <div className="flex gap-1.5 ml-2 shrink-0">
              {pendingTaskCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  <CheckSquare className="w-2.5 h-2.5 mr-0.5" />{pendingTaskCount}
                </Badge>
              )}
              {priorityCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  <Flag className="w-2.5 h-2.5 mr-0.5" />{priorityCount}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>

        {/* Ticker bar */}
        {!collapsed && (notes.length > 0 || priorities.length > 0) && (
          <div className="px-5 pb-3">
            <TickerBar notes={notes} priorities={priorities} />
          </div>
        )}

        {/* Body */}
        {!collapsed && (
          <div className="px-5 pb-5">
            <Tabs defaultValue="notes">
              <TabsList className="w-full mb-4 grid grid-cols-5 h-9">
                <TabsTrigger value="notes" className="text-xs gap-1">
                  <FileText className="w-3 h-3" /> Notes
                </TabsTrigger>
                <TabsTrigger value="priorities" className="text-xs gap-1">
                  <Flag className="w-3 h-3" /> Priorities
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs gap-1">
                  <CheckSquare className="w-3 h-3" /> Tasks
                </TabsTrigger>
                <TabsTrigger value="focus" className="text-xs gap-1">
                  <Target className="w-3 h-3" /> Focus
                </TabsTrigger>
                <TabsTrigger value="reminders" className="text-xs gap-1">
                  <Bell className="w-3 h-3" /> Reminders
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes">
                <NotesTab notes={notes} onChange={(n) => save({ notes: n })} />
              </TabsContent>
              <TabsContent value="priorities">
                <PrioritiesTab
                  priorities={priorities}
                  onChange={(p) => save({ priorities: p })}
                  focusToday={record?.focus_today}
                  onPlanReady={(plan) => save({ daily_plan: plan })}
                />
              </TabsContent>
              <TabsContent value="tasks">
                <TasksTab tasks={tasks} onChange={(t) => save({ tasks: t })} priorities={priorities} onPrioritiesChange={(p) => save({ priorities: p })} />
              </TabsContent>
              <TabsContent value="focus">
                <FocusTab
                  focusToday={record?.focus_today}
                  focusDate={record?.focus_date}
                  onChange={(data) => save(data)}
                  notes={notes}
                  tasks={tasks}
                  priorities={priorities}
                />
              </TabsContent>
              <TabsContent value="reminders">
                <RemindersTab reminders={reminders} onChange={(r) => save({ reminders: r })} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </motion.div>

      {record?.daily_plan && (
        <DailyPlan
          plan={record.daily_plan}
          onUpdate={(updatedPlan) => save({ daily_plan: updatedPlan })}
          onDismiss={() => save({ daily_plan: null })}
        />
      )}
      <ContextPopup notes={notes} priorities={priorities} />
      <PriorityDeadlineNotifier priorities={priorities} />
    </>
  );
}
```

### 3.2 NotesTab.jsx
- AI-powered brain dump organization
- List/card view toggle
- Expandable notes with original + formatted versions

### 3.3 PrioritiesTab.jsx
- Priority management with due dates
- 4 priority levels: Critical, High, Medium, Low
- Sub-tasks for each priority
- List/card view toggle
- PriorityCoach integration button

### 3.4 TasksTab.jsx
- Simple task management
- Pending/completed separation
- Priority-derived tasks (read-only)

### 3.5 FocusTab.jsx
- Daily focus setting
- AI-powered relevance finder
- Connects focus to related notes/tasks/priorities

### 3.6 RemindersTab.jsx
- Recurring reminder tracking
- Nudge counter
- Last nudged timestamp

### 3.7 TickerBar.jsx
- Rotating display of notes and priorities
- Weighted by urgency
- Auto-rotates every 4 seconds

### 3.8 ContextPopup.jsx
- Proactive reminder popup
- Triggers after typing activity
- Shows saved items count

### 3.9 PriorityDeadlineNotifier.jsx
- Browser notification system
- Triggers at 3 days, 1 day, and day of deadline

### 3.10 DailyPlan.jsx
- AI-generated daily plan display
- Visual workflow map
- Individual priority task workflows
- Progress tracking
- AI Help button for each task
- Struggle button for priorities

### 3.11 PriorityCoach.jsx
- 4-step wizard:
  1. Recommend priorities based on focus
  2. Rank selected priorities
  3. Select/add tasks
  4. Generate AI plan (detailed or summary)

---

## 4. Required UI Components

Ensure these shadcn/ui components are installed:
- button
- badge
- tabs
- input
- textarea
- toast (for notifications)

---

## 5. Styling (index.css)

Add these CSS variables to your `:root` and `.dark`:
```css
:root {
  --violet-500: 254 83% 63%;
  --purple-600: 279 66% 50%;
  --emerald-500: 142 71% 45%;
  --amber-500: 38 92% 50%;
}
```

---

## 6. Integration Requirements

### Core Integration (Built-in)
The system uses `base44.integrations.Core.InvokeLLM` for:
- Note organization (NotesTab)
- Focus relevance finding (FocusTab)
- Daily plan generation (PriorityCoach)
- Task AI help (DailyPlan)
- Struggle tips (DailyPlan)

### Setup in App
1. Import OrganizerPanel in your Dashboard or main page
2. Pass the current user object as prop
3. Ensure user is authenticated

Example:
```jsx
import OrganizerPanel from "./components/organizer/OrganizerPanel";

// In your main page component
<OrganizerPanel user={currentUser} />
```

---

## 7. Key Features Summary

### Notes Tab
- Free-form brain dumping
- AI organizes into subject + formatted content
- Preserves original entry
- List/card views
- Expandable details

### Priorities Tab
- 4 priority levels with color coding
- Optional due dates with countdown
- Sub-tasks per priority
- Edit inline
- List/card views
- Sorted by priority level then due date

### Tasks Tab
- Quick task addition
- Toggle completion
- Delete tasks
- Shows priority-derived tasks (read-only)

### Focus Tab
- Set daily focus goal
- AI finds related notes/tasks/priorities
- One focus per day
- Easy reset

### Reminders Tab
- Add recurring reminders
- Nudge button to track completions
- Shows nudge count and last nudged time

### Daily Plan (Generated)
- Visual priority flow map
- Individual task workflow maps per priority
- AI-generated plan with markdown formatting
- Progress tracking
- AI Help button on each task
- Struggle button on each priority

### Contextual Features
- Ticker bar: rotating relevant items
- Context popup: proactive reminders
- Deadline notifications: browser alerts

---

## 8. File Structure

```
components/
  organizer/
    OrganizerPanel.jsx      (main container)
    NotesTab.jsx
    PrioritiesTab.jsx
    TasksTab.jsx
    FocusTab.jsx
    RemindersTab.jsx
    TickerBar.jsx
    ContextPopup.jsx
    PriorityDeadlineNotifier.jsx
    DailyPlan.jsx
    PriorityCoach.jsx
entities/
  PersonalOrganizer.json
```

---

## 9. Testing Checklist

- [ ] Notes: AI organization works
- [ ] Priorities: Add/edit/delete, sub-tasks, due dates
- [ ] Tasks: Add/toggle/delete, priority tasks show
- [ ] Focus: Set/reset, AI relevance finder
- [ ] Reminders: Add/nudge/delete
- [ ] Ticker bar: Rotates items
- [ ] Daily Plan: Generates with workflow maps
- [ ] AI Help: Task assistance works
- [ ] Context popup: Appears after typing
- [ ] Notifications: Permission requested, triggers on deadlines

---

## 10. Customization Tips

### Colors
Change gradient in OrganizerPanel header:
```jsx
bg-gradient-to-br from-violet-500 to-purple-600
```

### Priority Levels
Edit `PRIORITY_LEVELS` array in PrioritiesTab.jsx

### Ticker Timing
Change interval in TickerBar.jsx:
```jsx
setInterval(() => ..., 4000) // 4 seconds
```

### Notification Thresholds
Edit in PriorityDeadlineNotifier.jsx:
```jsx
[0, 1, 3].forEach(threshold => ...) // days before due
```

---

## Support

For issues or questions about implementation, refer to Base44 documentation or reach out to support.