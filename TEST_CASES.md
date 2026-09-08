# Test Cases & Verification Matrix - XYZ College CRM

This document records the manual and automated validation results performed on the MVP.

| Test Case ID | Scope | Verification Description | Input / Action | Expected Result | Status |
| --- | --- | --- | --- | --- | --- |
| **TC-01** | Authentication | Admin Login | `admin@college.edu` / `admin123` | Successful login, cookie issued, redirected to Dashboard with Admin controls | **PASS** |
| **TC-02** | Authentication | Counsellor Login | `priya@college.edu` / `counsellor123` | Successful login, restricted navigation, only assigned leads visible | **PASS** |
| **TC-03** | Validation | Invalid Email & Missing Contact | Email: `bad-format`, Phone: empty | Rejected with inline error: *"Please enter a valid email address"* | **PASS** |
| **TC-04** | Validation | Past Follow-up Date on New Lead | Date: `2024-01-01` | Rejected with error: *"Next follow-up date for new leads cannot be in the past"* | **PASS** |
| **TC-05** | Duplicate Check | Duplicate Email / Phone Warning | Email: `aarav.patel@gmail.com` | Duplicate Warning Modal rendered with existing student summary & override option | **PASS** |
| **TC-06** | Lead Creation | Create Lead & Schedule Follow-up | Valid lead form submission | Lead inserted into DB, initial activity log created, metrics updated on Dashboard | **PASS** |
| **TC-07** | Strict RBAC | Data Isolation across Counsellors | Member queries `/api/leads` | Member sees only their assigned leads (`assignedToId = user.id`); Admin sees total college count | **PASS** |
| **TC-08** | Search & Filter | Combinable Multi-Filters | Search: `"Diya"`, Status: `Interested` | Table filters dynamically to show Diya Sen matching both conditions simultaneously | **PASS** |
| **TC-09** | Status Pipeline | Fast-forward Pipeline Stage | Change status to `Contacted` | Status pill updates, status change activity logged automatically on timeline | **PASS** |
| **TC-10** | Activity Logging | Record Call & Next Action | Type: `Call`, Notes: `"Fee structure discussed"`, Next Action: `"WhatsApp brochure"` | Entry renders on chronological timeline with counsellor attribution and timestamp | **PASS** |
| **TC-11** | Follow-Up Engine | Auto-tag Calculation | Target dates: `< today`, `== today`, `> today` | Badges render `Overdue` (red), `Due Today` (yellow), and `Upcoming` (green) dynamically | **PASS** |
| **TC-12** | Dashboard | Live Query Metrics & Charts | Query `/api/dashboard` | All counts computed from DB queries (0 hardcoded values); Recharts render correctly | **PASS** |
| **TC-13** | Team Scorecard | Counsellor Performance Grouping (Admin) | Admin queries `/api/team` | Team table aggregates leads, contacted, converted, overdue, and conversion % per counsellor | **PASS** |
| **TC-14** | Reporting | Channel ROI & SLA Compliance | Query `/api/reports` | Computes conversion rate, lead source breakdown, and follow-up on-time compliance rate | **PASS** |
| **TC-15** | Export | CSV Download | Click "Export" in Leads list | Generates well-formatted CSV with all filtered student fields | **PASS** |
| **TC-16** | Strict RBAC | Team Scorecard Access Restriction | Member queries `/api/team` | Returns HTTP 403 Forbidden; team management restricted to Admins | **PASS** |
| **TC-17** | Student Privacy | Duplicate Check Privacy Isolation | Member checks duplicate for other counsellor's student | Duplicate flag returned with `existingLead: null`, preventing student details leakage | **PASS** |

## Automated Test Runner Execution

All test cases were executed against an isolated disposable test database via `npm test` (`npx tsx scripts/test-e2e.ts`).

**Result:** 15/15 automated test suites passed (100% success rate). Disposable database cleanly provisioned and destroyed upon test completion.

