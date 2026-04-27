# Project Instructions for Claude

- All UI work MUST go through the `frontend-design` skill. Never write components or pages ad-hoc.
- All implementation follows the plans in `docs/superpowers/plans/`. Do not skip steps.
- Use pnpm, not npm.
- Tests are mandatory: every lib file has a `.test.ts`. Every API route has an integration test.
- Tone in user-facing copy: **pt-PT, "tu" form, casual but trustworthy**. Never "obrigado/a" — just "obrigado".
- Currency: € with `Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })`. Dates with `pt-PT` locale.
- Phone: always normalize to E.164 (`+3519XXXXXXXX`) server-side before storage.
