import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Check, X, HelpCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function HowToAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // { id, question, answer, keywords }
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ question: "", answer: "", keywords: "" });

  const { data: answers = [], isLoading } = useQuery({
    queryKey: ["howto-answers"],
    queryFn: () => base44.entities.HowToAnswer.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HowToAnswer.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["howto-answers"] }); setAdding(false); setDraft({ question: "", answer: "", keywords: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HowToAnswer.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["howto-answers"] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HowToAnswer.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["howto-answers"] }),
  });

  const parseKeywords = (str) => str.split(",").map(k => k.trim()).filter(Boolean);

  const saveNew = () => {
    if (!draft.question.trim() || !draft.answer.trim()) return;
    createMutation.mutate({ ...draft, keywords: parseKeywords(draft.keywords), is_active: true });
  };

  const saveEdit = () => {
    if (!editing.question.trim() || !editing.answer.trim()) return;
    updateMutation.mutate({
      id: editing.id,
      data: { question: editing.question, answer: editing.answer, keywords: parseKeywords(editing.keywordsStr || "") },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">How To — Admin Answers</h1>
          </div>
          <div className="ml-auto">
            <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Answer
            </Button>
          </div>
        </div>

        {/* Add form */}
        {adding && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Input placeholder="Question (e.g. How do I submit an expense report?)" value={draft.question} onChange={e => setDraft(d => ({ ...d, question: e.target.value }))} />
            <Textarea placeholder="Answer..." value={draft.answer} onChange={e => setDraft(d => ({ ...d, answer: e.target.value }))} className="resize-none min-h-[80px]" />
            <Input placeholder="Keywords (comma-separated): expense, reimbursement, finance" value={draft.keywords} onChange={e => setDraft(d => ({ ...d, keywords: e.target.value }))} />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveNew} disabled={!draft.question.trim() || !draft.answer.trim()}>
                <Check className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setDraft({ question: "", answer: "", keywords: "" }); }}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Answer list */}
        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {answers.map(a => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              {editing?.id === a.id ? (
                <div className="space-y-2">
                  <Input value={editing.question} onChange={e => setEditing(ed => ({ ...ed, question: e.target.value }))} />
                  <Textarea value={editing.answer} onChange={e => setEditing(ed => ({ ...ed, answer: e.target.value }))} className="resize-none min-h-[80px]" />
                  <Input placeholder="Keywords (comma-separated)" value={editing.keywordsStr} onChange={e => setEditing(ed => ({ ...ed, keywordsStr: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}><Check className="w-3.5 h-3.5 mr-1" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground text-sm">{a.question}</p>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => setEditing({ id: a.id, question: a.question, answer: a.answer, keywordsStr: (a.keywords || []).join(", ") })}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(a.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.answer}</p>
                  {(a.keywords || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {a.keywords.map(k => (
                        <Badge key={k} variant="secondary" className="text-xs px-1.5 py-0">{k}</Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {!isLoading && answers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No answers yet — add your first one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}