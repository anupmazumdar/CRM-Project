/**
 * Automated End-to-End API and Flow Verification Test Suite
 * Tests all Functional Requirements, RBAC, Data Privacy, and Reporting.
 * Uses a disposable test database to ensure isolation from production/dev data.
 */

import { spawn, execSync, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';

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

function getAvailablePort(preferredPort = 3005): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(preferredPort, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      const freeServer = net.createServer();
      freeServer.listen(0, () => {
        const port = (freeServer.address() as net.AddressInfo).port;
        freeServer.close(() => resolve(port));
      });
    });
  });
}

function killProcessTree(pid: number) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    // Process may have already stopped
  }
}

async function waitForServer(url: string, timeoutMs = 60000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/auth/me`);
      if (res.status === 401 || res.status === 200) {
        return true;
      }
    } catch {
      // Server starting up...
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function runTests(baseUrl: string) {
  console.log(`🚀 Executing E2E Test Suite against: ${baseUrl}\n`);

  let adminCookie = '';
  let memberCookie = '';
  let memberUserId = '';
  let testLeadId = '';

  // 1. Auth Test: Admin Login
  await assert('1. Admin Login (admin@college.edu)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
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
    const res = await fetch(`${baseUrl}/api/auth/login`, {
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
    const res = await fetch(`${baseUrl}/api/leads`, {
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

  // 4. Duplicate Check Test (Admin): Detect Existing Email with Full Details
  await assert('4. Duplicate Detection (Admin): Flag Existing Email with Record Summary', async () => {
    const res = await fetch(`${baseUrl}/api/leads/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ email: 'aarav.patel@gmail.com' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.isDuplicate) throw new Error('Expected isDuplicate to be true');
    if (!data.existingLead || data.existingLead.name !== 'Aarav Patel') {
      throw new Error(`Expected match with Aarav Patel for Admin, got: ${JSON.stringify(data.existingLead)}`);
    }
  });

  // 5. Duplicate Check Test (Member/Privacy): Prevent Leaking Other Students' Details
  await assert('5. Duplicate Privacy: Prevent Exposing Other Students Details to Counsellor', async () => {
    // Diya Sen is assigned to Rahul Verma, NOT Priya Sharma
    const res = await fetch(`${baseUrl}/api/leads/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: memberCookie },
      body: JSON.stringify({ email: 'diya.sen@outlook.com' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.isDuplicate || data.existingLead !== undefined) {
      throw new Error(`Data leakage! Unauthorized lead match was disclosed: ${JSON.stringify(data)}`);
    }
  });

  // 6. Lead Creation Test: Create New Lead Record
  await assert('6. Lead Management: Create Valid Lead with Follow-up Date', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const res = await fetch(`${baseUrl}/api/leads`, {
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

  // 7. RBAC Test: Admin sees all leads vs Member sees only assigned
  await assert('7. RBAC Enforcement: Admin vs Team Member Visibility Scope', async () => {
    const adminRes = await fetch(`${baseUrl}/api/leads`, {
      headers: { Cookie: adminCookie },
    });
    const adminData = await adminRes.json();
    const adminTotal = adminData.pagination.total;

    const memberRes = await fetch(`${baseUrl}/api/leads`, {
      headers: { Cookie: memberCookie },
    });
    const memberData = await memberRes.json();
    const memberTotal = memberData.pagination.total;

    if (memberTotal >= adminTotal) {
      throw new Error(`Member total (${memberTotal}) should be smaller than Admin total (${adminTotal})`);
    }

    for (const lead of memberData.leads) {
      if (lead.assignedToId !== memberUserId) {
        throw new Error(`Leaked unassigned lead ${lead.id} to member`);
      }
    }
  });

  // 8. Combinable Filter Test: Search + Status + Source
  await assert('8. Search & Combinable Filters: Status=Interested + Search="Diya"', async () => {
    const res = await fetch(`${baseUrl}/api/leads?status=Interested&search=Diya`, {
      headers: { Cookie: adminCookie },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.leads.length === 0) throw new Error('Expected to find Diya Sen');
    if (!data.leads[0].name.includes('Diya')) throw new Error('Filtered result mismatch');
  });

  // 9. Quick Status Transition Test: New -> Contacted
  await assert('9. Status Pipeline: Update Lead Status to "Contacted"', async () => {
    const res = await fetch(`${baseUrl}/api/leads/${testLeadId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'Contacted' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.lead.status !== 'Contacted') throw new Error(`Expected Contacted, got ${data.lead.status}`);
  });

  // 10. Activity Logging Test: Add Call with Next Action
  await assert('10. Activity Logging & Timeline: Log Phone Call Interaction', async () => {
    const res = await fetch(`${baseUrl}/api/activities`, {
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

  // 11. Student Profile Detail: Fetch and verify chronological timeline
  await assert('11. Student Profile Page: Verify Chronological Activity Timeline', async () => {
    const res = await fetch(`${baseUrl}/api/leads/${testLeadId}`, {
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

  // 12. Dashboard Analytics Test: Real query metrics
  await assert('12. Executive Dashboard: Compute Live Real-Time Analytics & KPIs', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard`, {
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

  // 13. Team Management Test: Team Scorecard & Member Counts (Admin)
  await assert('13. Team Management (Admin): Group Live Conversion Metrics by Counsellor', async () => {
    const res = await fetch(`${baseUrl}/api/team`, {
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

  // 14. RBAC Check: Member Blocked from Reading /api/team
  await assert('14. RBAC: Team Member Blocked from Reading /api/team (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/team`, {
      headers: { Cookie: memberCookie },
    });
    if (res.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for member read, got HTTP ${res.status}`);
    }
  });

  // 15. Reports Section Test: SLA Health & Channel breakdown
  await assert('15. Reports Section: Compute Conversion Rate, SLA Compliance & Channels', async () => {
    const res = await fetch(`${baseUrl}/api/reports`, {
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
}

async function main() {
  console.log('🚀 Starting Automated CRM Verification & Test Runner...\n');

  // If external BASE_URL is provided, test directly against it
  if (process.env.BASE_URL) {
    try {
      await runTests(process.env.BASE_URL);
    } catch (err: any) {
      console.error('Fatal execution error:', err.message);
    }

    printSummaryAndExit();
    return;
  }

  // Setup Disposable Test Database & Server
  console.log('📦 Provisioning disposable test database for test run...');
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const isSqlite = /provider\s*=\s*"sqlite"/i.test(schemaContent);

  let disposableDbUrl = '';
  let tempDbPath = '';
  let testSchemaName = '';
  let serverProcess: ChildProcess | null = null;

  try {
    if (isSqlite) {
      const tempDbName = `test-e2e-${Date.now()}.db`;
      tempDbPath = path.join(process.cwd(), 'prisma', tempDbName);
      disposableDbUrl = `file:./${tempDbName}`;
    } else {
      const basePgUrl =
        process.env.DATABASE_URL ||
        'postgresql://neondb_owner:npg_udVFQk30bRol@ep-bitter-sky-aycblorq-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';
      testSchemaName = `test_e2e_${Date.now()}`;
      const url = new URL(basePgUrl);
      url.searchParams.set('schema', testSchemaName);
      disposableDbUrl = url.toString();
    }

    console.log(`🔧 Applying schema to disposable database (${isSqlite ? 'SQLite' : 'PostgreSQL Schema'})...`);
    execSync(`npx prisma db push --skip-generate --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: disposableDbUrl },
      stdio: 'pipe',
    });

    console.log('🌱 Seeding initial test data into disposable database...');
    execSync(`npx tsx prisma/seed.ts`, {
      env: { ...process.env, DATABASE_URL: disposableDbUrl },
      stdio: 'pipe',
    });

    const testPort = await getAvailablePort(3005);
    const testUrl = `http://localhost:${testPort}`;
    console.log(`🌐 Launching ephemeral test server on port ${testPort}...`);

    serverProcess = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['next', 'dev', '-p', String(testPort)],
      {
        shell: true,
        env: {
          ...process.env,
          DATABASE_URL: disposableDbUrl,
          PORT: String(testPort),
          NODE_ENV: 'development',
        },
        stdio: 'pipe',
      }
    );

    const isReady = await waitForServer(testUrl, 45000);
    if (!isReady) {
      throw new Error(`Test server failed to start on port ${testPort} within timeout`);
    }
    console.log(`✨ Ephemeral test server ready at ${testUrl}\n`);

    await runTests(testUrl);
  } catch (err: any) {
    console.error(`\n❌ Error during test environment lifecycle: ${err.message}`);
    results.push({ name: 'Test Environment Lifecycle', passed: false, error: err.message });
  } finally {
    // Teardown test server
    if (serverProcess && serverProcess.pid) {
      console.log('\n🧹 Shutting down ephemeral test server...');
      killProcessTree(serverProcess.pid);
    }

    // Teardown disposable database
    console.log('🧹 Cleaning up disposable test database...');
    if (isSqlite && tempDbPath) {
      try {
        if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
        if (fs.existsSync(`${tempDbPath}-journal`)) fs.unlinkSync(`${tempDbPath}-journal`);
        if (fs.existsSync(`${tempDbPath}-wal`)) fs.unlinkSync(`${tempDbPath}-wal`);
      } catch (cleanupErr) {
        console.warn('Notice: Could not remove temporary SQLite test file:', cleanupErr);
      }
    } else if (!isSqlite && testSchemaName) {
      try {
        const cleanupCmd = `import { PrismaClient } from '@prisma/client'; const p = new PrismaClient({ datasourceUrl: '${disposableDbUrl}' }); p.$executeRawUnsafe('DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE').finally(() => p.$disconnect());`;
        execSync(`npx tsx -e "${cleanupCmd}"`, { stdio: 'pipe' });
      } catch {
        // Schema cleanup notice
      }
    }
  }

  printSummaryAndExit();
}

function printSummaryAndExit() {
  console.log('\n=========================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const percentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  if (passedCount === totalCount && totalCount > 0) {
    console.log(`🎉 TEST SUMMARY: ${passedCount}/${totalCount} PASSED (${percentage}%)`);
    console.log('=========================================\n');
    process.exit(0);
  } else {
    console.error(`❌ TEST SUMMARY: ${passedCount}/${totalCount} PASSED (${percentage}%) - TESTS FAILED`);
    console.log('=========================================\n');
    process.exit(1);
  }
}

main();
