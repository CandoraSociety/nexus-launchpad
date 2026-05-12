import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

import WelcomeHeader from "../components/dashboard/WelcomeHeader";
import AppGrid from "../components/dashboard/AppGrid";
import QuickActions from "../components/dashboard/QuickActions";
import StatusBar from "../components/dashboard/StatusBar";
import PinnedApps from "../components/dashboard/PinnedApps";

const AUTH_HIERARCHY = { executive: 4, admin: 3, manager: 2, standard: 1 };

export default function Dashboard() {
  // Get current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Get employee record linked to current user
  const { data: employees, isLoading: empLoading } = useQuery({
    queryKey: ["employee", user?.email],
    queryFn: () => base44.entities.Employee.filter({ email: user.email }),
    enabled: !!user?.email,
  });

  const employee = employees?.[0];

  // Get all registered apps
  const { data: allApps, isLoading: appsLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => base44.entities.AppRegistration.filter({ is_active: true }),
    initialData: [],
  });

  // Filter apps based on employee's authorization level and explicit app_access
  const accessibleApps = React.useMemo(() => {
    if (!allApps) return [];
    
    const userLevel = employee?.authorization_level || "standard";
    const userLevelNum = AUTH_HIERARCHY[userLevel] || 1;
    const explicitAccess = new Set(employee?.app_access || []);

    return allApps.filter(app => {
      // Check minimum authorization level
      const appMinLevel = AUTH_HIERARCHY[app.min_authorization_level] || 1;
      const hasLevelAccess = userLevelNum >= appMinLevel;
      
      // Check explicit access list (if employee has app_access defined, also include those)
      const hasExplicitAccess = explicitAccess.size === 0 || explicitAccess.has(app.app_id);
      
      return hasLevelAccess && hasExplicitAccess;
    });
  }, [allApps, employee]);

  const isLoading = userLoading || empLoading || appsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
        {/* Top bar with quick actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">N</span>
            </div>
            <span className="font-semibold text-foreground text-lg tracking-tight">Nexus</span>
          </div>
          <QuickActions />
        </div>

        {/* Welcome section */}
        <WelcomeHeader employee={employee} user={user} />

        {/* Status bar */}
        <StatusBar employee={employee} />

        {/* Pinned / Quick Access (optional add-on) */}
        <PinnedApps apps={accessibleApps} employee={employee} />

        {/* App grid */}
        <AppGrid apps={accessibleApps} employee={employee} />
      </div>
    </div>
  );
}