import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

import WelcomeHeader from "../components/dashboard/WelcomeHeader";
import AppGrid from "../components/dashboard/AppGrid";
import QuickActions from "../components/dashboard/QuickActions";
import StatusBar from "../components/dashboard/StatusBar";
import PinnedApps from "../components/dashboard/PinnedApps";
import OrganizerPanel from "../components/organizer/OrganizerPanel";
import HowToSearch from "../components/howto/HowToSearch";

const HUB_URL = "https://beacon-92324875.base44.app/functions/getHubConfig";

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

  // Fetch hub config (apps + branding)
  const { data: hubData, isLoading: hubLoading } = useQuery({
    queryKey: ["hubConfig"],
    queryFn: async () => {
      const res = await fetch(HUB_URL);
      return res.json();
    },
    initialData: { apps: [], config: { branding: {} } },
  });

  const allApps = (hubData?.apps || []).filter(a => a.is_active);
  const branding = hubData?.config?.branding || {};

  const isLoading = userLoading || empLoading || hubLoading;

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
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: branding.brand_primary_color || "#003DA5" }}
            >
              {branding.brand_logo_url ? (
                <img src={branding.brand_logo_url} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <span className="text-white font-bold text-sm">N</span>
              )}
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
        <PinnedApps apps={allApps} employee={employee} branding={branding} />

        {/* Organizer Panel (full width, DailyPlan flows naturally) */}
        <OrganizerPanel user={user} />

        {/* HowTo Search (full width below Organizer) */}
        <HowToSearch />

        {/* App grid */}
        <AppGrid apps={allApps} employee={employee} branding={branding} />
      </div>
    </div>
  );
}