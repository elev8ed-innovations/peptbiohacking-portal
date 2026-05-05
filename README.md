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
