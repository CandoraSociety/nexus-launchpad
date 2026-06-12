# How-To Knowledge Base - Complete Replication Guide

## Overview
A dual-mode knowledge base system that searches preset company answers first, then falls back to AI-powered responses when no preset exists. Includes an admin interface for managing the knowledge base.

---

## 1. Required Packages

```bash
# Already included in most Base44 apps:
- framer-motion
- @tanstack/react-query
- lucide-react
- react-router-dom

# No additional packages needed
```

---

## 2. Entity Schema

Create `entities/HowToAnswer.json`:

```json
{
  "name": "HowToAnswer",
  "type": "object",
  "properties": {
    "question": {
      "type": "string",
      "description": "The how-to question"
    },
    "answer": {
      "type": "string",
      "description": "Admin-written answer"
    },
    "keywords": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Keywords to help match search queries"
    },
    "category": {
      "type": "string",
      "description": "Optional category grouping"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["question", "answer"]
}
```

---

## 3. Component Files

### 3.1 HowToSearch.jsx (User-Facing Search)
Location: `components/howto/HowToSearch.jsx`

**Features:**
- Search bar with keyword matching
- Preset company answers display
- AI fallback when no preset found
- Collapsible panel design
- Loading states

**Key Logic:**
```javascript
// Search preset answers by keyword/question similarity
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

// If no presets, call AI
if (matches.length === 0) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a helpful workplace assistant. Answer this "how to" question concisely and practically in 2-4 sentences: "${query}"`,
  });
}
```

**UI Structure:**
- Header with icon and collapse button
- Search input with icon
- Results section showing:
  - Company Answer badges (from presets)
  - AI Answer with Sparkles icon (when no preset)
  - Loading state with pulse animation

---

### 3.2 HowToAdmin.jsx (Admin Interface)
Location: `pages/HowToAdmin.jsx`

**Features:**
- Full CRUD for knowledge base entries
- Inline editing
- Keyword management (comma-separated)
- Add/Edit/Delete operations
- Back button to dashboard

**Key Logic:**
```javascript
// Parse comma-separated keywords
const parseKeywords = (str) => str.split(",").map(k => k.trim()).filter(Boolean);

// Create new entry
createMutation.mutate({ 
  ...draft, 
  keywords: parseKeywords(draft.keywords), 
  is_active: true 
});

// Update existing
updateMutation.mutate({
  id: editing.id,
  data: { 
    question: editing.question, 
    answer: editing.answer, 
    keywords: parseKeywords(editing.keywordsStr || "") 
  },
});
```

**UI Structure:**
- Header with back button and "Add Answer" button
- Add form (collapsible) with:
  - Question input
  - Answer textarea
  - Keywords input (comma-separated hint)
  - Save/Cancel buttons
- Answer list with:
  - Question (bold)
  - Answer (muted text)
  - Keyword badges
  - Edit/Delete buttons per entry

---

## 4. Required UI Components

Ensure these shadcn/ui components are installed:
- button
- badge
- input
- textarea
- toast (optional, for notifications)

---

## 5. Routing Setup

Add route to `App.jsx`:

```jsx
import HowToAdmin from './pages/HowToAdmin';

// In Routes:
<Route path="/how-to-admin" element={<HowToAdmin />} />
```

---

## 6. Integration Requirements

### Core Integration (Built-in)
Uses `base44.integrations.Core.InvokeLLM` for AI fallback answers.

**Prompt used:**
```
You are a helpful workplace assistant. Answer this "how to" question concisely and practically in 2-4 sentences: "{user_question}"
```

---

## 7. File Structure

```
entities/
  HowToAnswer.json
pages/
  HowToAdmin.jsx
components/
  howto/
    HowToSearch.jsx
```

---

## 8. Usage Flow

### For End Users:
1. User types question in search bar (e.g., "How do I submit expenses?")
2. System searches preset answers by:
   - Question text match
   - Answer text match
   - Keyword match
3. If presets found → Display "Company Answer" cards
4. If no presets → Call AI and display "AI Answer"
5. User gets immediate answer

### For Admins:
1. Navigate to `/how-to-admin`
2. Click "Add Answer"
3. Fill in:
   - Question (e.g., "How do I request time off?")
   - Answer (detailed company policy)
   - Keywords (e.g., "time off, PTO, vacation, leave")
4. Save
5. Edit/Delete anytime

---

## 9. Styling Details

### Header Gradient
```jsx
bg-gradient-to-br from-sky-500 to-blue-600
```

### Preset Answer Card
```jsx
rounded-xl border border-border bg-muted/30 p-4
```

### AI Answer Card
```jsx
rounded-xl border border-violet-200 bg-violet-50/50 p-4
```

### Keyword Badges
```jsx
<Badge variant="secondary" className="text-xs px-1.5 py-0">{keyword}</Badge>
```

---

## 10. Example Data

Seed your knowledge base with examples:

```json
{
  "question": "How do I submit an expense report?",
  "answer": "Log into the finance portal, navigate to Expenses > New Report, attach receipts, select the appropriate cost center, and submit for manager approval. Reimbursements are processed within 5-7 business days.",
  "keywords": ["expense", "reimbursement", "finance", "receipt", "report"]
}

{
  "question": "How do I request time off?",
  "answer": "Submit a PTO request through HRIS at least 2 weeks in advance. Go to Time Off > Request, select dates, choose PTO type, and add a note. Your manager will approve within 48 hours.",
  "keywords": ["PTO", "vacation", "leave", "time off", "absence"]
}

{
  "question": "How do I set up my direct deposit?",
  "answer": "Navigate to Payroll > Direct Deposit in the employee portal. Enter your bank routing number, account number, and account type. Upload a voided check or bank letter. Changes take effect next pay cycle.",
  "keywords": ["payroll", "bank", "direct deposit", "payment", "salary"]
}
```

---

## 11. Search Behavior

### Matching Logic (Case-Insensitive)
1. Check if query exists in question text
2. Check if query exists in answer text
3. Check if query exists in any keyword
4. Return all matches (can be multiple)

### Example Matches:
- Query: "expense" → Matches entries with "expense" in question, answer, or keywords
- Query: "PTO" → Matches entries tagged with "PTO" keyword
- Query: "how to submit" → Matches entries containing that phrase

---

## 12. AI Fallback Behavior

**When triggered:** No preset answers match the query

**Prompt characteristics:**
- Role: Helpful workplace assistant
- Tone: Concise and practical
- Length: 2-4 sentences
- Format: Plain text (no markdown)

**Credit cost:** 1 integration credit per AI call

---

## 13. Admin Access Control

**Important:** The admin page currently has no auth guard. Add authorization:

```jsx
// At top of HowToAdmin component
const { user } = useAuth();
if (user?.role !== 'admin') {
  return <Navigate to="/" />;
}
```

Or wrap with ProtectedRoute:
```jsx
<Route path="/how-to-admin" element={
  <ProtectedRoute requiredRole="admin">
    <HowToAdmin />
  </ProtectedRoute>
} />
```

---

## 14. Customization Options

### Change AI Personality
Edit the prompt in HowToSearch.jsx:
```javascript
prompt: `You are an expert HR assistant. Provide detailed, policy-compliant answers to workplace questions. Answer: "${query}"`
```

### Add Categories
1. Add `category` field to entity schema
2. Add category dropdown in admin form
3. Add category filter in search component

### Add Search History
Track user queries in PersonalOrganizer or separate entity for analytics.

### Enable Rich Text Answers
Replace Textarea with React Quill for formatted answers (bold, lists, links).

---

## 15. Testing Checklist

- [ ] Entity created with correct schema
- [ ] HowToSearch renders on dashboard
- [ ] Search matches preset answers
- [ ] AI fallback works when no preset
- [ ] Admin page accessible at /how-to-admin
- [ ] Add answer works (question, answer, keywords)
- [ ] Edit answer works inline
- [ ] Delete answer works
- [ ] Keywords display as badges
- [ ] Back button returns to dashboard
- [ ] Admin auth guard implemented (if needed)

---

## 16. Integration with Dashboard

Add HowToSearch to your Dashboard page:

```jsx
import HowToSearch from "./components/howto/HowToSearch";

// In Dashboard layout
<div className="space-y-6">
  <WelcomeHeader user={user} employee={employee} />
  <HowToSearch />
  <OrganizerPanel user={user} />
  {/* ... other widgets */}
</div>
```

---

## 17. Performance Considerations

### Entity Queries
- Filter by `is_active: true` to hide inactive entries
- Use TanStack Query caching for instant repeat searches
- Consider pagination if knowledge base grows >100 entries

### AI Calls
- Only triggered when no preset found
- Cached by query (same question = same AI answer in session)
- Monitor credit usage in Base44 dashboard

---

## 18. Common Issues & Solutions

**Issue:** AI answers not showing
- **Solution:** Check Core integration is enabled, verify prompt syntax

**Issue:** Keywords not matching
- **Solution:** Ensure comma-separated input, check parseKeywords function

**Issue:** Admin changes not reflecting
- **Solution:** Verify query invalidation in mutation onSuccess

**Issue:** Search not case-insensitive
- **Solution:** Ensure `.toLowerCase()` on both query and data

---

## 19. Future Enhancements

- **Categories/Tags:** Group answers by department (HR, Finance, IT)
- **Rating System:** Let users rate answer helpfulness
- **Search Analytics:** Track common queries to identify knowledge gaps
- **Multi-language:** Add language selection for diverse teams
- **Attachments:** Allow PDFs/screenshots in answers
- **Version History:** Track answer edits over time

---

## 20. Support

For implementation issues, refer to Base44 documentation on:
- Entity management
- TanStack Query integration
- Core InvokeLLM usage
- Admin authentication

---

**End of Guide**