import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield } from "lucide-react";

export default function AppCard({ app, isAdmin, index, branding }) {
  const primary = branding?.brand_primary_color || "#003DA5";
  const secondary = branding?.brand_secondary_color || "#FFD100";

  const displayName = app.app_name || app.name || "App";
  const url = app.app_url || app.url || "#";
  const emoji = app.icon && app.icon.match(/\p{Emoji}/u) ? app.icon : null;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg cursor-pointer"
      style={{ "--brand-primary": primary, "--brand-secondary": secondary }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: `${primary}18` }}
        >
          {emoji ? (
            <span>{emoji}</span>
          ) : (
            <span className="text-base font-bold" style={{ color: primary }}>
              {displayName.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-medium"
              style={{ borderColor: `${secondary}80`, backgroundColor: `${secondary}20`, color: "#7a5c00" }}
            >
              <Shield className="w-2.5 h-2.5 mr-0.5" />
              Admin
            </Badge>
          )}
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <h3
        className="font-semibold text-foreground text-base mb-1 transition-colors"
        style={{ "--tw-text-opacity": 1 }}
      >
        <span className="group-hover:text-[var(--brand-primary)] transition-colors">{displayName}</span>
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
        {app.description || "Launch this application"}
      </p>

      <div
        className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between"
      >
        <span className="text-xs text-muted-foreground capitalize">{app.category}</span>
        {app.audience && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${primary}15`, color: primary }}
          >
            {app.audience}
          </span>
        )}
      </div>

      {/* Brand accent line on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
        style={{ backgroundColor: secondary }}
      />
    </motion.a>
  );
}