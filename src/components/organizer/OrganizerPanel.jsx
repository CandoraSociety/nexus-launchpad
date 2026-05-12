import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Brain, CheckSquare, Target, Bell, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TasksTab from "./TasksTab";
import FocusTab from "./FocusTab";
import RemindersTab from "./RemindersTab";
import ThoughtsTab from "./ThoughtsTab";

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

  // Debounced save
  const save = useCallback((patch) => {
    saveMutation.mutate(patch);
  }, [record?.id, user?.email]);

  const pendingTaskCount = (record?.tasks || []).filter(t => !t.done).length;
  const reminderCount = (record?.reminders || []).length;

  return (
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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm leading-tight">Organization for the Disorganized</h2>
            <p className="text-xs text-muted-foreground">Your personal chaos management center</p>
          </div>
          <div className="flex gap-1.5 ml-2">
            {pendingTaskCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                <CheckSquare className="w-2.5 h-2.5 mr-0.5" />{pendingTaskCount}
              </Badge>
            )}
            {reminderCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                <Bell className="w-2.5 h-2.5 mr-0.5" />{reminderCount}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 pb-5">
          <Tabs defaultValue="tasks">
            <TabsList className="w-full mb-4 grid grid-cols-4 h-9">
              <TabsTrigger value="tasks" className="text-xs gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="focus" className="text-xs gap-1.5">
                <Target className="w-3.5 h-3.5" /> Focus
              </TabsTrigger>
              <TabsTrigger value="reminders" className="text-xs gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Reminders
              </TabsTrigger>
              <TabsTrigger value="thoughts" className="text-xs gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Thoughts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <TasksTab
                tasks={record?.tasks || []}
                onChange={(tasks) => save({ tasks })}
              />
            </TabsContent>
            <TabsContent value="focus">
              <FocusTab
                focusToday={record?.focus_today}
                focusDate={record?.focus_date}
                onChange={(data) => save(data)}
              />
            </TabsContent>
            <TabsContent value="reminders">
              <RemindersTab
                reminders={record?.reminders || []}
                onChange={(reminders) => save({ reminders })}
              />
            </TabsContent>
            <TabsContent value="thoughts">
              <ThoughtsTab
                thoughts={record?.thoughts || []}
                onChange={(thoughts) => save({ thoughts })}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </motion.div>
  );
}