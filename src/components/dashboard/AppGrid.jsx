import React, { useState } from "react";
import AppCard from "./AppCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid } from "lucide-react";

export default function AppGrid({ apps, employee, branding }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const adminAppIds = new Set(employee?.admin_apps || []);

  // Get unique categories from available apps
  const categories = ["all", ...new Set(apps.map(a => a.category).filter(Boolean))];

  const filtered = apps.filter(app => {
    const name = app.app_name || app.name || "";
    const matchSearch = !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      app.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || app.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Your Applications</h2>
          <span className="text-sm text-muted-foreground">({filtered.length})</span>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {categories.length > 2 && (
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
          <TabsList className="bg-muted/50 h-auto flex-wrap gap-1 p-1">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="capitalize text-xs px-3 py-1.5">
                {cat === "all" ? "All Apps" : cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No apps found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((app, index) => (
            <AppCard
              key={app.id}
              app={app}
              isAdmin={adminAppIds.has(app.app_id)}
              index={index}
              branding={branding}
            />
          ))}
        </div>
      )}
    </div>
  );
}