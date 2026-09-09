# 🎓 XYZ College Admissions Management CRM

> **A centralized, high-performance admissions pipeline and student relationship management platform for XYZ College**, replacing fragmented Excel sheets, WhatsApp groups, and email threads with live funnel analytics, role-based workflows, and automated follow-up tracking.
>
> 🌐 **Live Production URL:** [https://crm-project-kohl-gamma.vercel.app](https://crm-project-kohl-gamma.vercel.app)

---

## 📌 Problem Statement

XYZ College previously managed prospective student inquiries across scattered Excel files, personal WhatsApp chats, and disconnected email inboxes. This led to:

- **Duplicate Records:** Multiple counsellors contacting the same student with conflicting information.
- **Missed Follow-Ups:** Inquiries going cold due to lack of scheduled reminders and SLA tracking.
- **No Shared Communication History:** Context was lost when leads transferred between counsellors.
- **Zero Team Visibility:** Admissions leadership had no real-time metrics on source ROI, conversion ratios, or individual counsellor workloads.

**Solution:** A unified admissions CRM providing instant search, combinable multi-criteria filtering, duplicate warning modals, sequential status pipelines, chronological activity timelines, real-time Recharts visualizations, and strict Role-Based Access Control (RBAC).

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
| --- | --- | --- |
| **Frontend & API** | **Next.js 14 (App Router)** + TypeScript | Unified React full-stack framework with server components and edge/node API routes. |
| **Styling & Design** | **Tailwind CSS** + Lucide React | High-density admissions UI with curated color tokens, glassmorphism, and responsive layouts. |
| **Database & ORM** | **PostgreSQL / SQLite via Prisma ORM** | SQLite out-of-the-box for instant local setup with zero external setup, seamlessly switchable to PostgreSQL via `.env`. |
| **Authentication & RBAC** | **JWT Session (jose) + HTTP-only cookies + bcryptjs** | Secure multi-role authentication (`ADMIN` vs `MEMBER`) enforced at both the API and UI layers. |
| **Data Validation** | **Zod** | Schema validation with specific inline error handling and duplicate detection. |
| **Visualizations** | **Recharts** | Real-time interactive charts for monthly inflow, pipeline distribution, channel ROI, and team performance. |

---

## 🏛 Database Schema

The database model is defined in [`prisma/schema.prisma`](file:///./prisma/schema.prisma):

```mermaid
erDiagram
    USER ||--o{ LEAD : "assigned to"
    USER ||--o{ ACTIVITY : "logged by"
    LEAD ||--o{ ACTIVITY : "interaction history"

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        string role "ADMIN | MEMBER"
        string department
        datetime createdAt
    }

    LEAD {
        string id PK
        string name
        string email
        string phone
        string college
        string course
        int gradYear
        string city
        string source
        string status "New | Contacted | Interested | Follow_up | Converted | Lost"
        datetime nextFollowUpDate
        string notes
        string assignedToId FK
        datetime createdAt
    }

    ACTIVITY {
        string id PK
        string leadId FK
        string type "Call | WhatsApp | Email | Meeting | Follow_up"
        datetime date
        string notes
        string nextAction
        string createdById FK
        datetime createdAt
    }
```

---

## ⚡ Quickstart & Local Setup (< 2 Minutes)

### 1. Prerequisites

- **Node.js** 18+ (Node 20+ or 24 recommended)
- **npm** 9+

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/anupmazumdar/CRM-Project.git
cd CRM-Project
npm install
```

### 3. Initialize Database & Seed Demo Data

```bash
# Push schema to SQLite database (creates dev.db)
npm run db:push

# Seed with 40+ realistic leads, 4 users, and chronological activity timelines
npm run db:seed
```

### 4. Launch the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Initial User Accounts & Permissions

Initial account credentials are generated uniquely at database initialization via `npm run db:seed` (which outputs randomized, cryptographically strong passwords to the console once upon generation) or provisioned directly through environment setup. Credentials must never be committed to version control, and default/demo credentials must never be reused in production.

| Role | Email | Initial Password | Permissions Scope |
| --- | --- | --- | --- |
| **Admin (Admissions Dean)** | `admin@college.edu` | Generated at seed time | Full visibility across all leads, team scorecards, lead assignment, user creation, deletion, and reporting. |
| **Counsellor (Senior Staff)** | `priya@college.edu` | Generated at seed time | Restricted visibility — views & updates only their assigned leads, logs activities, schedules follow-ups. |
| **Counsellor (Staff)** | `rahul@college.edu` | Generated at seed time | Management admissions portfolio. |
| **Counsellor (Staff)** | `ananya@college.edu` | Generated at seed time | Design & tech admissions portfolio. |

---

## 🚀 Key Functional Modules

### 1. Executive Admissions Dashboard (`/`)

- **Live KPI Cards:** Total Leads, New, Contacted, Interested, Follow-ups Due, Converted, Lost, and Conversion %.
- **Recharts Visualizations:**
  - *Monthly Registration Inflow* (Area Chart)
  - *Pipeline Stage Funnel* (Bar Chart)
  - *Lead Acquisition by Channel* (Donut Chart)
  - *Counsellor Workload vs Conversions* (Horizontal Comparison)
- **High-Priority Follow-ups Widget** with 1-click WhatsApp, call, and view profile actions.
- **Recent Team Activity Feed** with author attribution.

### 2. Student Leads Management (`/leads`)

- **Combinable Filters:** Search across name, phone, email, college combined with Status, Source, Counsellor, Course, Follow-up State, and Date Range.
- **Duplicate Record Detection:** Warns if email/phone already exists with an option to review existing or override.
- **CSV Export:** 1-click export of filtered leads.

### 3. Student Profile & Timeline (`/leads/[id]`)

- **Student Header:** Contact details, course, previous school/college, city, assigned counsellor.
- **Sequential Pipeline Stepper:** 1-click progression (`New` → `Contacted` → `Interested` → `Follow_up` → `Converted` → `Lost`).
- **Direct Contact Box:** 1-click `tel:`, WhatsApp chat (`wa.me`), and `mailto:` links.
- **Chronological Activity Timeline:** Phone calls, WhatsApp messages, emails, campus visits with next-action pills.

### 4. Admissions Pipeline Kanban (`/pipeline`)

- Interactive stage columns with lead counter badges and quick "Advance" buttons.

### 5. Follow-ups Queue (`/follow-ups`)

- Dynamic auto-tagging:
  - 🔴 **Overdue** (`next_follow_up_date < today`)
  - 🟡 **Due Today** (`next_follow_up_date == today`)
  - 🟢 **Upcoming** (`next_follow_up_date > today`)
- Quick activity logging modal directly from queue.

### 6. Team Scorecard (`/team`)

- Live counsellor conversion scorecard computed from assigned leads: Assigned, Contacted, Interested, Converted, Overdue SLA count, and Conversion %.
- Admin modal to create new admissions counsellors.

### 7. Intelligence Reports (`/reports`)

- Conversion rate analysis, lead source ROI, program demand breakdown, and follow-up SLA compliance.

---

## 🧪 Automated Test Suite

Run the end-to-end test suite verifying all 13 core requirements:

```bash
npx tsx scripts/test-e2e.ts
```

---

## 🛡 Security & Edge Hardening

- **Strict API RBAC:** Team Members cannot access or modify unassigned leads by guessing URLs or querying API routes directly.
- **Edge-compatible JWT:** Token verification runs in Edge middleware without pulling Node-specific binaries.
- **Sanitized Inputs & Zod Validation:** Inline errors for malformed emails, invalid phone lengths, past follow-up dates on new leads.

---

## 🌐 Production Deployment (Vercel & PostgreSQL)

The CRM is architected to run seamlessly on **Vercel** with a managed cloud PostgreSQL database (such as [Neon](https://neon.tech), [Supabase](https://supabase.com), or AWS RDS).

### 1. Configure for PostgreSQL

Run the automated provider switch script:

```bash
npm run db:use:postgres
```

*(To switch back to local SQLite at any time, simply run `npm run db:use:sqlite`)*

### 2. Setup Cloud PostgreSQL Database (e.g. Neon)

1. Sign up for free at [Neon](https://neon.tech) and create a project (e.g. `college-crm`).
2. Copy your pooled connection string (with `?sslmode=require`).

### 3. Push Database Schema & Seed Data

In your terminal, set your remote `DATABASE_URL` and run:

```bash
# Push schema tables to your cloud PostgreSQL database
npx prisma db push

# (Optional) Seed realistic college demo data for local/staging development only
npm run db:seed
```

> ⚠️ **CRITICAL SECURITY NOTICES FOR PRODUCTION:**
> - **Production Seed Guard:** `npm run db:seed` will refuse to run against any production `DATABASE_URL` (`NODE_ENV=production`, `VERCEL=1`, or cloud hosts) to protect production data and prevent mock data insertion.
> - **Mandatory Credential Rotation:** Any staging or production environment that was ever initialized or seeded using legacy demo credentials (`admin123`, `counsellor123`) must have those accounts' passwords rotated immediately via the self-service profile page or admin reset endpoint.

### 4. Deploy to Vercel

1. Push your repository to GitHub:

   ```bash
   git push origin main
   ```

2. In [Vercel Dashboard](https://vercel.com), click **Add New Project** and import `CRM-Project`.
3. Under **Environment Variables**, add:
   - `DATABASE_URL`: `postgres://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `JWT_SECRET`: A secure random string (e.g. `openssl rand -base64 32`)
   - `UPSTASH_REDIS_REST_URL`: Upstash Redis database REST URL (mandatory in production)
   - `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis database REST Token (mandatory in production)
   - `NEXT_PUBLIC_SHOW_DEMO_LOGINS`: `"false"` for production mode
4. Click **Deploy**! Vercel automatically runs `postinstall: prisma generate` and `next build`.

---

## 📈 Known Limitations & Future Roadmap

- **SMS Gateway Integration:** Add Twilio/Gupshup SMS webhook trigger for instant automated SMS on lead creation.
- **WhatsApp Cloud API Integration:** Send automated WhatsApp greeting brochures via Meta Graph API.
- **Bulk Lead CSV Import:** Upload Excel sheets with column mapping interface.
- **Email Notifications:** Daily morning briefing email sent to counsellors with their overdue follow-up list.

