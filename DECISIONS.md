# Architecture & Product Decision Log (DECISIONS.md)

This log records every non-trivial product, architectural, and design decision made during the MVP development of XYZ College CRM, along with its justification.

| Decision ID | Area | Decision Made | Rationale / Justification |
| --- | --- | --- | --- |
| **DEC-001** | Tech Stack | Next.js 14 App Router + React + TypeScript + Tailwind CSS | Provides rapid unified full-stack development, server-side data fetching, strict typing, and high-performance UI rendering within the 6-day MVP scope. |
| **DEC-002** | Database & ORM | Prisma ORM with SQLite default (configured for seamless PostgreSQL swap) | SQLite allows zero-friction, one-command setup (`npm run db:push && npm run db:seed`) for reviewers and local testing without Docker/cloud DB prerequisites, while Prisma makes production Postgres migration trivial. |
| **DEC-003** | Auth System | Custom JWT session with HTTP-only cookies + bcryptjs | Eliminates complex external auth service configurations, provides deterministic multi-role RBAC (`ADMIN` vs `MEMBER`) enforced at both the API layer and UI guards. |
| **DEC-004** | Status Pipeline | Fixed 6-stage lifecycle: `New` → `Contacted` → `Interested` → `Follow_up` → `Converted` → `Lost` | Reflects actual admissions funnel requirements while allowing non-linear status adjustments when needed. |
| **DEC-005** | Duplicate Detection | Soft-warning modal on duplicate email/phone with override option | Prevents accidental duplicate student entries while catering to edge cases (e.g. siblings sharing parent phone). |
| **DEC-006** | Follow-Up Engine | Computed dynamic status (`Overdue` < today, `Due Today` = today, `Upcoming` > today) | Guarantees follow-up tags are always 100% accurate relative to real-time client date without needing asynchronous background cron mutation. |
| **DEC-007** | Strict RBAC Rules | Admin views/edits all leads & manages team; Team Member views & edits only assigned leads | Prevents data leakage between counsellors while giving admissions heads full visibility into team conversions. |
| **DEC-008** | Activity Logging | 5 core channels (`Call`, `Email`, `WhatsApp`, `Meeting`, `Follow_up`) with inline next-action & follow-up scheduler | Ensures every counsellor interaction captures the context and automatically schedules the next touchpoint. |
| **DEC-009** | UI/UX Theme | Modern slate/navy palette with vibrant status colors and responsive collapsible sidebar | Delivers a high-density, professional admissions dashboard optimized for desktop and tablet daily usage. |
| **DEC-010** | Database Dual-Provider Strategy | Automated provider switching script (`npm run db:use:postgres` / `npm run db:use:sqlite`) + `postinstall: prisma generate` | Ensures frictionless zero-setup local development with SQLite while providing 100% production compatibility with PostgreSQL (Neon/Supabase) on Vercel serverless. |
| **DEC-011** | Route Dynamism & Build Optimization | Explicit `export const dynamic = 'force-dynamic'` on auth & cookie-dependent API routes | Prevents Next.js build-time prerendering attempts on authenticated endpoints, ensuring deterministic serverless execution on Vercel. |
