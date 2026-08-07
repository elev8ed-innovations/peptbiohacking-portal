# PeptBiohacking Portal

Patient/doctor portal PWA for PeptBiohacking — Dr. Fernando Valenzuela Carpio.

**Stack:** React + Vite + Supabase + React Router + Tailwind CSS

## Setup

1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env` and add your Supabase credentials
4. Run the SQL in `supabase_schema.sql` in your Supabase SQL Editor
5. `npm run dev`

## Deploy

Connected to Netlify at `pept-app.netlify.app`. Push to `main` to auto-deploy (if Netlify GitHub integration is configured).

## Doctor AI summary

The doctor-only patient summary runs in the authenticated Supabase Edge Function
`doctor-summary`. Netlify serves the portal frontend but does not process the
patient snapshot or hold the AI provider key.

Set these secrets in Supabase Edge Function Secrets (never with a `VITE_` prefix):

```text
OPENROUTER_API_KEY=<dedicated restricted key>
OPENROUTER_MODEL=deepseek/deepseek-r1:free
```

Deploy with JWT verification enabled:

```bash
supabase functions deploy doctor-summary --use-api
```

The function requires a signed-in user, verifies the `doctor` role through RLS,
queries only bounded patient records, removes known identifiers, sends no lab
file contents, enforces ZDR/no-data-collection routing, stores metadata-only usage
records, and rate-limits each doctor. The result is a draft that requires medical
review; it is not a diagnosis or prescription.

## Roles

- **Doctor** — login with doctor account to access patient list, create consultations, view check-ins
- **Patient** — login to view protocol, log daily check-ins, contact doctor via WhatsApp

## Color Scheme

- Navy: `#0A1628`
- Teal: `#00C2A8`
- Gold: `#C9A84C`

## Fonts

- Display: Cormorant Garamond
- Body: Outfit
