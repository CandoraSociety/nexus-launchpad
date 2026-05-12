import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HowToSearch() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { data: allAnswers = [] } = useQuery({
    queryKey: ["howto-answers"],
    queryFn: () => base44.entities.HowToAnswer.filter({ is_active: true }),
  });

  // Match preset answers by keyword/question similarity
  const presetMatches = submittedQuery
    ? allAnswers.filter(a => {
        const q = submittedQuery.toLowerCase();
        return (
          a.question.toLowerCase().includes(q) ||
          a.answer.toLowerCase().includes(q) ||
          (a.keywords || []).some(k => k.toLowerCase().includes(q))
        );
      })
    : [];

  const search = async () => {
    if (!query.trim()) return;
    setSubmittedQuery(query);
    setAiAnswer(null);

    // Check presets first — if none found, call AI
    const matches = allAnswers.filter(a => {
      const q = query.toLowerCase();
      return (
        a.question.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q) ||
        (a.keywords || []).some(k => k.toLowerCase().includes(q))
      );
    });

    if (matches.length === 0) {
      setAiLoading(true);
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a helpful workplace assistant. Answer this "how to" question concisely and practically in 2-4 sentences: "${query}"`,
        });
        setAiAnswer(res);
      } finally {
        setAiLoading(false);
      }
    }
  };

  const hasResults = presetMatches.length > 0 || aiAnswer || aiLoading;

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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm leading-tight">How To...</h2>
            <p className="text-xs text-muted-foreground">Ask anything — preset answers or AI-powered</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 pb-5 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="How to submit an expense report..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                className="pl-9"
              />
            </div>
            <Button onClick={search} disabled={!query.trim() || aiLoading}>
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
            </Button>
          </div>

          <AnimatePresence>
            {submittedQuery && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {/* Preset answers */}
                {presetMatches.map(a => (
                  <div key={a.id} className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wide">Company Answer</p>
                    <p className="text-sm font-medium text-foreground">{a.question}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.answer}</p>
                  </div>
                ))}

                {/* AI answer */}
                {aiLoading && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                )}
                {aiAnswer && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                      <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">AI Answer</p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{aiAnswer}</p>
                  </div>
                )}

                {!aiLoading && !aiAnswer && presetMatches.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No answers found — try rephrasing your question.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}