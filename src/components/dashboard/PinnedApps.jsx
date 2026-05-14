import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, PinOff, GripVertical, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppCard from "./AppCard";

const STORAGE_KEY = "nexus_pinned_apps";

export default function PinnedApps({ apps, employee, branding }) {
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const adminAppIds = new Set(employee?.admin_apps || []);

  // Persist pinned IDs
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  const pinnedApps = pinnedIds
    .map(id => apps.find(a => a.app_id === id))
    .filter(Boolean);

  const unpinnedApps = apps.filter(a => !pinnedIds.includes(a.app_id));

  const togglePin = (appId) => {
    setPinnedIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  // If no pinned apps yet, show a prompt to get started
  if (pinnedIds.length === 0 && !isEditing) {
    return (
      <div
        className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
        onClick={() => setIsEditing(true)}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-medium text-foreground text-sm">Set up your Quick Access bar</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pin your most-used apps here for instant access at the top of your dashboard.</p>
        </div>
        <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => setIsEditing(true)}>
          <Pin className="w-3.5 h-3.5 mr-1.5" /> Pin Apps
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-base">Quick Access</h2>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">{pinnedApps.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isEditing ? "default" : "ghost"}
            className="text-xs h-7 px-2.5"
            onClick={() => setIsEditing(v => !v)}
          >
            {isEditing ? "Done" : "Edit"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setIsCollapsed(v => !v)}
          >
            {isCollapsed
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Pinned grid */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {pinnedApps.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-4">
                {pinnedApps.map((app, index) => (
                  <div key={app.id} className="relative group/pin">
                    <AppCard app={app} isAdmin={adminAppIds.has(app.app_id)} index={index} branding={branding} compact />
                    {isEditing && (
                      <button
                        onClick={() => togglePin(app.app_id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/pin:opacity-100 transition-opacity shadow-md z-10"
                        title="Unpin"
                      >
                        <PinOff className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* App picker when editing */}
            {isEditing && unpinnedApps.length > 0 && (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Available to pin</p>
                <div className="flex flex-wrap gap-2">
                  {unpinnedApps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => togglePin(app.app_id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-medium text-foreground"
                    >
                      <Pin className="w-3 h-3 text-muted-foreground" />
                      {app.app_name || app.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}