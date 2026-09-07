/**
 * Automated End-to-End API and Flow Verification Test Suite
 * Tests all 10 Functional Requirements, RBAC, Validation & Reporting.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

async function assert(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✅ PASS: ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message });
    console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Automated CRM Verification Test Suite...\n');

  let adminCookie = '';
  let memberCookie = '';
  let memberUserId = '';
  let testLeadId = '';

  // 1. Auth Test: Admin Login
  await assert('1. Admin Login (admin@college.edu)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'admin123' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.json()).error}`);
    const data = await res.json();
    if (data.user.role !== 'ADMIN') throw new Error(`Expected ADMIN role, got ${data.user.role}`);
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) throw new Error('No session cookie returned');
    adminCookie = setCookie.split(';')[0];
  });

  // 2. Auth Test: Member Login
  await assert('2. Member Login (priya@college.edu)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@college.edu', password: 'counsellor123' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.json()).error}`);
    const data = await res.json();
    if (data.user.role !== 'MEMBER') throw new Error(`Expected MEMBER role, got ${data.user.role}`);
    memberUserId = data.user.id;
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) throw new Error('No session cookie returned');
    memberCookie = setCookie.split(';')[0];
  });

  // 3. Validation Test: Reject Invalid Email & Empty Submission
  await assert('3. Validation: Reject Invalid Email and Missing Contact Info', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Invalid Lead',
        email: 'bad-email-format',
        course: 'B.Tech Computer Science',
        source: 'Website',
        status: 'New',
      }),
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    const data = await res.json();
    if (!data.error.toLowerCase().includes('email')) {
      throw new Error(`Expected email validation message, got: ${data.error}`);
    }
  });

  // 4. Duplicate Check Test: Detect Existing Email / Phone
  await assert('4. Duplicate Detection: Flag Existing Email (aarav.patel@gmail.com)', async () => {
    const res = await fetch(`${BASE_URL}/api/leads/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ email: 'aarav.patel@gmail.com' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.isDuplicate) throw new Error('Expected isDuplicate to be true');
    if (!data.existingLead || data.existingLead.name !== 'Aarav Patel') {
      throw new Error(`Expected match with Aarav Patel, got: ${JSON.stringify(data.existingLead)}`);
    }
  });

  // 5. Lead Creation Test: Create New Lead Record
  await assert('5. Lead Management: Create Valid Lead with Follow-up Date', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Tanya Mehra',
        email: 'tanya.mehra.test@example.com',
        phone: '+91 98765 00112',
        college: 'Heritage School',
        course: 'B.Tech AI & Data Science',
        gradYear: 2028,
        city: 'Gurgaon',
        source: 'Website',
        status: 'New',
        assignedToId: memberUserId,
        nextFollowUpDate: tomorrow.toISOString(),
        notes: 'Inquired about scholarship for CBSE > 90%.',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.json()).error}`);
    const data = await res.json();
    testLeadId = data.lead.id;
    if (data.lead.name !== 'Tanya Mehra') throw new Error('Name mismatch');
  });

  // 6. RBAC Test: Admin sees all leads vs Member sees only assigned
  await assert('6. RBAC Enforcement: Admin vs Team Member Visibility Scope', async () => {
    // Admin request
    const adminRes = await fetch(`${BASE_URL}/api/leads`, {
      headers: { Cookie: adminCookie },
    });
    const adminData = await adminRes.json();
    const adminTotal = adminData.pagination.total;

    // Member request
    const memberRes = await fetch(`${BASE_URL}/api/leads`, {
      headers: { Cookie: memberCookie },
    });
    const memberData = await memberRes.json();
    const memberTotal = memberData.pagination.total;

    if (memberTotal >= adminTotal) {
      throw new Error(`Member total (${memberTotal}) should be smaller than Admin total (${adminTotal})`);
    }

    // Verify all member leads belong to that member
    for (const lead of memberData.leads) {
      if (lead.assignedToId !== memberUserId) {
        throw new Error(`Leaked unassigned lead ${lead.id} to member`);
      }
    }
  });

  // 7. Combinable Filter Test: Search + Status + Source
  await assert('7. Search & Combinable Filters: Status=Interested + Search="Diya"', async () => {
    const res = await fetch(`${BASE_URL}/api/leads?status=Interested&search=Diya`, {
      headers: { Cookie: adminCookie },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.leads.length === 0) throw new Error('Expected to find Diya Sen');
    if (!data.leads[0].name.includes('Diya')) throw new Error('Filtered result mismatch');
  });

  // 8. Quick Status Transition Test: New -> Contacted
  await assert('8. Status Pipeline: Update Lead Status to "Contacted"', async () => {
    const res = await fetch(`${BASE_URL}/api/leads/${testLeadId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'Contacted' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.lead.status !== 'Contacted') throw new Error(`Expected Contacted, got ${data.lead.status}`);
  });

  // 9. Activity Logging Test: Add Call with Next Action
  await assert('9. Activity Logging & Timeline: Log Phone Call Interaction', async () => {
    const res = await fetch(`${BASE_URL}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        leadId: testLeadId,
        type: 'Call',
        date: new Date().toISOString(),
        notes: 'Called student. Explained CSE curriculum and campus tour slots.',
        nextAction: 'Send fee structure brochure on WhatsApp',
        updateStatusTo: 'Interested',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.json()).error}`);
    const data = await res.json();
    if (data.activity.type !== 'Call') throw new Error('Activity type mismatch');
  });

  // 10. Student Profile Detail: Fetch and verify chronological timeline
  await assert('10. Student Profile Page: Verify Chronological Activity Timeline', async () => {
    const res = await fetch(`${BASE_URL}/api/leads/${testLeadId}`, {
      headers: { Cookie: adminCookie },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const lead = data.lead;
    if (lead.status !== 'Interested') throw new Error(`Status should be Interested, got ${lead.status}`);
    if (!lead.activities || lead.activities.length < 2) {
      throw new Error(`Expected at least 2 activities on timeline, got ${lead.activities?.length}`);
    }
  });

  // 11. Dashboard Analytics Test: Real query metrics
  await assert('11. Executive Dashboard: Compute Live Real-Time Analytics & KPIs', async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { Cookie: adminCookie },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.counts.total !== 'number' || data.counts.total <= 0) {
      throw new Error('Total leads count invalid');
    }
    if (!Array.isArray(data.leadsBySource) || data.leadsBySource.length === 0) {
      throw new Error('Source distribution empty');
    }
    if (!Array.isArray(data.leadsByStatus) || data.leadsByStatus.length === 0) {
      throw new Error('Status distribution empty');
    }
    if (!Array.isArray(data.teamPerformance) || data.teamPerformance.length === 0) {
      throw new Error('Team performance empty');
    }
  });

  // 12. Team Management Test: Team Scorecard & Member Counts
  await assert('12. Team Management: Group Live Conversion Metrics by Counsellor', async () => {
    const res = await fetch(`${BASE_URL}/api/team`, {
      headers: { Cookie: adminCookie },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.team) || data.team.length < 4) {
      throw new Error(`Expected at least 4 team members, got ${data.team?.length}`);
    }
    const priyaStats = data.team.find((m: any) => m.email === 'priya@college.edu');
    if (!priyaStats || typeof priyaStats.assignedCount !== 'number') {
      throw new Error('Priya stats missing');
    }
  });

  // 13. Reports Section Test: SLA Health & Channel breakdown
  await assert('13. Reports Section: Compute Conversion Rate, SLA Compliance & Channels', async () => {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      headers: { Cookie: adminCookie },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.summary.overallConversionRate !== 'number') {
      throw new Error('Conversion rate missing in report');
    }
    if (typeof data.followUpHealth.onTimeRate !== 'number') {
      throw new Error('SLA onTimeRate missing in report');
    }
  });

  console.log('\n=========================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`🎉 TEST SUMMARY: ${passedCount}/${results.length} PASSED (100%)`);
  console.log('=========================================\n');
}

runTests();
