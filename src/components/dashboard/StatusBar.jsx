import React from "react";
import { motion } from "framer-motion";
import { Clock, Wifi, Shield } from "lucide-react";
import { format } from "date-fns";

export default function StatusBar({ employee }) {
  const level = employee?.authorization_level || "standard";
  const appCount = employee?.app_access?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
    >
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Wifi className="w-4 h-4 text-emerald-500" />
        <span>Connected</span>
      </div>
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4" />
        <span>{appCount} app{appCount !== 1 ? "s" : ""} available</span>
      </div>
    </motion.div>
  );
}