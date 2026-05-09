# WellnessQuiz — Installation Guide
## Fix #4 · Portal v3.1

---

## 1. File placement

Copy `WellnessQuiz.jsx` to:
```
src/components/WellnessQuiz.jsx
```

---

## 2. Supabase SQL — run first

Open Supabase → SQL editor → run this block:

```sql
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS scores       jsonb,
  ADD COLUMN IF NOT EXISTS version      text DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Upsert on user_id (one assessment record per patient)
ALTER TABLE public.assessments
  DROP CONSTRAINT IF EXISTS assessments_user_id_key;

ALTER TABLE public.assessments
  ADD CONSTRAINT assessments_user_id_key UNIQUE (user_id);
```

---

## 3. Dashboard.jsx — add the import

At the top of `src/pages/Dashboard.jsx`:
```jsx
import WellnessQuiz from '../components/WellnessQuiz'
```

---

## 4. Dashboard.jsx — embed the quiz

Find the section in Dashboard.jsx where patient content renders
(after the welcome header, before or after the appointments section).
Add:

```jsx
{/* ── Wellness Assessment ── */}
<div className="mb-8">
  <h2 style={{
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 20,
    fontWeight: 600,
    color: '#0A1628',
    marginBottom: 16,
    letterSpacing: '0.02em',
  }}>
    {lang === 'es' ? 'Evaluación de Bienestar' : 'Wellness Assessment'}
  </h2>
  <WellnessQuiz
    user={user}
    lang={lang}
    onComplete={(scores) => {
      console.log('Quiz complete:', scores)
      // optionally refresh dashboard state here
    }}
  />
</div>
```

Where `user` = your Supabase auth user object and
`lang` = your LanguageContext value ('es' or 'en').

---

## 5. Deploy

```bash
# In Claude Code:
cp -R ~/Downloads/peptbiohacking-quiz/ ~/Documents/GitHub/peptbiohacking-portal/src/components/

# Then GitHub Desktop → commit "feat: add wellness quiz to dashboard (Fix #4)" → Push
```

Netlify auto-deploys in ~30 seconds. Verify at pept-app.netlify.app.

---

## Calendly note

Dr. V's Calendly is LIVE at:
  https://calendly.com/mdsportsmedicineandent

He needs to:
1. Create an event type (15 min consult)
2. Set availability (Mon–Thu 8–9 AM)
3. Connect Google Calendar / Google Meet
4. Share the event URL for the portal Book Consult embed

Book a 15-min Zoom with him to walk through this — it's a 1-time setup.
The Book Consult page in the portal already has the Calendly embed container
ready — just needs the final event URL dropped in.
