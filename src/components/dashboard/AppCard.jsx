import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield } from "lucide-react";
import {
  LayoutDashboard, Users, DollarSign, Settings, BarChart3,
  MessageSquare, Briefcase, FileText, Calendar, Mail,
  Database, Wrench, Heart, BookOpen, Zap, Globe
} from "lucide-react";

const iconMap = {
  LayoutDashboard, Users, DollarSign, Settings, BarChart3,
  MessageSquare, Briefcase, FileText, Calendar, Mail,
  Database, Wrench, Heart, BookOpen, Zap, Globe
};

const colorStyles = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100", hover: "hover:border-blue-300 hover:shadow-blue-100/50" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100", hover: "hover:border-purple-300 hover:shadow-purple-100/50" },
  green: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100", hover: "hover:border-emerald-300 hover:shadow-emerald-100/50" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100", hover: "hover:border-orange-300 hover:shadow-orange-100/50" },
  red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100", hover: "hover:border-red-300 hover:shadow-red-100/50" },
  teal: { bg: "bg-teal-50", icon: "text-teal-600", border: "border-teal-100", hover: "hover:border-teal-300 hover:shadow-teal-100/50" },
  pink: { bg: "bg-pink-50", icon: "text-pink-600", border: "border-pink-100", hover: "hover:border-pink-300 hover:shadow-pink-100/50" },
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-100", hover: "hover:border-indigo-300 hover:shadow-indigo-100/50" },
};

export default function AppCard({ app, isAdmin, index }) {
  const color = colorStyles[app.color] || colorStyles.blue;
  const IconComponent = iconMap[app.icon] || LayoutDashboard;

  return (
    <motion.a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className={`group relative flex flex-col rounded-xl border ${color.border} ${color.hover} bg-card p-5 transition-all duration-300 hover:shadow-lg cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${color.bg} p-3 rounded-xl`}>
          <IconComponent className={`w-6 h-6 ${color.icon}`} />
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-200 bg-amber-50 text-amber-700 font-medium">
              <Shield className="w-2.5 h-2.5 mr-0.5" />
              Admin
            </Badge>
          )}
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <h3 className="font-semibold text-foreground text-base mb-1 group-hover:text-primary transition-colors">
        {app.name}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
        {app.description || "Launch this application"}
      </p>

      <div className="mt-4 pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground capitalize">{app.category}</span>
      </div>
    </motion.a>
  );
}