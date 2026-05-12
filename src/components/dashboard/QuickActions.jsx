import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, Bell, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const actions = [
  { label: "Notifications", icon: Bell, variant: "outline" },
  { label: "Help & Support", icon: HelpCircle, variant: "outline" },
  { label: "Settings", icon: Settings, variant: "outline" },
];

export default function QuickActions() {
  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex flex-wrap items-center gap-2"
    >
      {actions.map(({ label, icon: Icon, variant }) => (
        <Button key={label} variant={variant} size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </motion.div>
  );
}