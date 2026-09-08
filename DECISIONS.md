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
| **DEC-012** | Team Management RBAC | `/api/team` read and write operations restricted strictly to `ADMIN` users | Protects counsellor conversion rates and team roster data from peer inspection; returns HTTP 403 Forbidden for `MEMBER` accounts. |
| **DEC-013** | Duplicate Check Privacy | Suppress student profile details (`existingLead: null`) for unassigned counsellor matches | Prevents duplicate check endpoint from functioning as a data enumeration oracle across counsellors. |
| **DEC-014** | Test Infrastructure & Credential Hardening | Ephemeral disposable test database in E2E runner + strict JWT secret validation | Eliminates test pollution of dev/production databases, ensures runner exits non-zero on test failures, and prevents hardcoded secret exploitation. |
| **DEC-015** | Startup JWT Secret Enforcement | Remove fallback JWT secret; throw fatal error on missing `JWT_SECRET` at runtime | Eliminates silent fallback to guessable secrets in production; supports safe build-phase asset generation. |
| **DEC-016** | Duplicate Check RBAC & Scoping | Role-aware lead duplicate checking (`MEMBER` scoped to `assignedToId = session.id`) | Prevents duplicate checking endpoint from being used as a cross-counsellor candidate data enumeration oracle. |
| **DEC-017** | Anti-Enumeration & Login Rate Limiting | Unified error message ("Invalid email or password") + in-memory lockout map (5 attempts / 15m) | Thwarts brute force credential stuffing and prevents attackers from discovering registered staff emails. |
| **DEC-018** | Opt-In Demo Credentials | Strict opt-in check (`NEXT_PUBLIC_SHOW_DEMO_LOGINS === 'true'`) | Protects production deployments from displaying sample credentials on login screens by default. |
| **DEC-019** | HTTP Security Headers | Add strict CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy | Prevents clickjacking, MIME sniffing, protocol downgrades, and XSS across the application. |
| **DEC-020** | Next.js CVE Resolution (14.2.35) | Upgrade to latest patched 14.x branch (`14.2.35`) | Resolves critical middleware authorization bypass and redirect SSRF vulnerabilities while maintaining 100% Next 14 App Router API stability. |
| **DEC-021** | App Router Resilience & Error Boundaries | Root and route-level `error.tsx`, `loading.tsx`, and `not-found.tsx` | Eliminates blank white screens on slow network connections or uncaught exceptions, providing user-facing retry UI. |
| **DEC-022** | Modal Accessibility & Focus Trapping | Reusable `useModalFocus` hook with Tab/Shift+Tab trapping and Escape dismissal | Conforms with WCAG accessibility guidelines and ensures keyboard-only navigability across all dialogs. |

## Edge Cases and Security Concerns Identified and Resolved

1. **Unchecked JWT Secret Fallback (Security / Critical)**
   - *Risk:* If `JWT_SECRET` was omitted from deployment environment variables, the system previously fell back to a hardcoded string, allowing attackers to forge arbitrary admin authentication tokens.
   - *Resolution:* Removed the fallback; the application immediately aborts with a fatal startup error if `JWT_SECRET` is unset, while safely handling Next.js static asset build phases.

2. **Cross-Counsellor Data Leakage via Duplicate Check (Privacy / RBAC)**
   - *Risk:* Calling `/api/leads/check-duplicate` with a candidate's email or phone returned lead records assigned to other counsellors, allowing unauthorized data scraping.
   - *Resolution:* Scoped duplicate search queries by role: `MEMBER` users can only match against leads where `assignedToId = session.id`, while `ADMIN` users can match across all college records.

3. **User Enumeration & Brute Force Vulnerability on Login (Security / Auth)**
   - *Risk:* Different error responses ("User does not exist" vs "Invalid password") allowed attackers to discover registered staff email addresses, and unthrottled endpoints enabled credential stuffing.
   - *Resolution:* Merged error responses into a single generic "Invalid email or password" message and implemented in-memory rate-limiting and temporary IP+email lockout after 5 consecutive failed attempts.

4. **Accidental Exposure of Demo Logins in Production (Security / Config)**
   - *Risk:* Demo buttons appeared by default unless `NEXT_PUBLIC_SHOW_DEMO_LOGINS` was explicitly set to `"false"`.
   - *Resolution:* Inverted the check to strict opt-in (`=== 'true'`), ensuring clean production deployments show no test credentials unless explicitly desired.

5. **Missing Security Headers (Security / Browser Hardening)**
   - *Risk:* Absence of frame and content type policies left the application susceptible to clickjacking and MIME confusion attacks.
   - *Resolution:* Added `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security` headers to `next.config.mjs`.

6. **Next.js 14.2.18 Known CVEs (Vulnerability / Dependency)**
   - *Risk:* Older 14.x releases suffered from middleware authorization bypass (GHSA-f82v-jwr5-mffw) and redirect SSRF (GHSA-4342-x723-ch2f).
   - *Resolution:* Upgraded to `next@14.2.35`, the latest patched 14.x maintenance release, successfully eliminating the critical vulnerabilities without introducing breaking Next 15 changes.

7. **Blank Screens on Network Latency or Unhandled Exceptions (Reliability / UX)**
   - *Risk:* Slow API fetches or unhandled rendering errors caused blank screens for users with no visual feedback or recovery mechanism.
   - *Resolution:* Added Next.js App Router `loading.tsx` skeletons and `error.tsx` error boundaries with retry buttons at the root and across `/leads`, `/pipeline`, `/reports`, `/team`, and `/follow-ups`.

8. **Keyboard Trapping & Modal Focus Restoration (Accessibility / WCAG)**
   - *Risk:* Opening modals allowed keyboard navigation to escape behind the backdrop into inactive page elements, disorienting screen reader and keyboard-only users.
   - *Resolution:* Implemented `useModalFocus` across `LeadFormModal`, `ActivityLogModal`, `DuplicateWarningModal`, and team management modals to trap focus inside open dialogs, handle `Escape` key close, and return focus to the trigger element upon dismissal.
