# Frontend redesign notes (Sep 2026)

**Constraint honored:** no left sidebar — portal keeps horizontal top command navigation.

## Visual system
- **Punched gradient KPI cards** (Berry-inspired on KPC dark canvas):
  - `punched-red` — primary revenue / critical
  - `punched-purple` — exposure / pending
  - `punched-blue` — operational counts / sync
  - `punched-dark` — secondary metrics
- Glass panels retained for tables, filters, charts
- `rounded-2xl` standardized for cards
- Gradient CTAs on login + public landing

## Files changed
### Core
- `components/kpi-card.tsx` — new punched tones
- `app/globals.css` — glow helpers
- `components/site-header.tsx` — gradient portal CTA

### Portal
- `app/portal/dashboard/page.tsx`
- `app/portal/movements/page.tsx` — denser table
- `app/portal/movements/[id]/page.tsx` — punched demurrage total
- `app/portal/billing/page.tsx`
- `app/portal/revenue-leakage/page.tsx`
- `app/portal/compliance/page.tsx`
- `app/portal/contracts/page.tsx`
- `app/portal/disputes/page.tsx`
- `app/portal/ai-intelligence/page.tsx`
- `app/portal/etl-pipeline/page.tsx`
- `app/portal/reports/page.tsx`
- `app/portal/yard-gis/page.tsx` — punched network snapshot strip

### Public
- `app/login/page.tsx` — gradient submit
- `app/page.tsx` — gradient CTA + punched metrics strip

## Run
```bash
cd frontend && npm install && npm run dev
```
