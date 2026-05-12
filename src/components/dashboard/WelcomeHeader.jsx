import React from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldAlert, User } from "lucide-react";

const levelConfig = {
  executive: { label: "Executive", icon: ShieldAlert, className: "bg-amber-100 text-amber-800 border-amber-200" },
  admin: { label: "Admin", icon: ShieldCheck, className: "bg-purple-100 text-purple-800 border-purple-200" },
  manager: { label: "Manager", icon: Shield, className: "bg-blue-100 text-blue-800 border-blue-200" },
  standard: { label: "Standard", icon: User, className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function WelcomeHeader({ employee, user }) {
  const name = employee?.full_name || user?.full_name || "Team Member";
  const firstName = name.split(" ")[0];
  const level = employee?.authorization_level || "standard";
  const config = levelConfig[level] || levelConfig.standard;
  const LevelIcon = config.icon;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-8 md:p-10 text-primary-foreground">
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full translate-y-1/2" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-primary-foreground/70 text-sm font-medium tracking-wide uppercase mb-1">
              {greeting}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {firstName}
            </h1>
            {employee?.job_title && (
              <p className="text-primary-foreground/80 mt-1 text-lg">
                {employee.job_title}
                {employee?.department && (
                  <span className="text-primary-foreground/60"> · {employee.department.charAt(0).toUpperCase() + employee.department.slice(1)}</span>
                )}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`${config.className} border px-3 py-1.5 text-sm font-medium gap-1.5`}>
              <LevelIcon className="w-3.5 h-3.5" />
              {config.label} Access
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}