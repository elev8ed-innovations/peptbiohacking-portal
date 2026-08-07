# Changelog

## 2026-08-06

- Added live progress dashboards for patients and doctors using existing Supabase data.
- Added validated BMI and body-metric capture with database-side BMI calculation.
- Added a doctor-only AI patient summary through an authenticated Supabase Edge Function.
- Kept patient identifiers and lab file contents out of AI requests, required zero-data-retention routing, and stored only usage metadata.
- Added per-doctor burst and daily limits and mandatory medical-review language.
