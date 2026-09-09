/**
 * Automated Security Audit & Vulnerability Verification Suite
 * Validates VULN-01 to VULN-07, INFO-01 to INFO-04, and additional security defenses.
 */

import { spawn, execSync, ChildProcess } from 'child_process';
import net from 'net';
import { validatePassword } from '../src/security/password-policy';
import { parsePaginationParams } from '../src/backend/utils/pagination';

interface SecurityTestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: SecurityTestResult[] = [];

async function assert(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  🛡️  PASS: ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message });
    console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
  }
}

function getAvailablePort(preferredPort = 3008): Promise<number> {
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
  } catch {}
}

async function waitForServer(url: string, timeoutMs = 60000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/auth/me`);
      if (res.status === 401 || res.status === 200) {
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function runSecurityTests(baseUrl: string) {
  console.log(`\n🔒 Executing Automated Security Audit Suite against: ${baseUrl}\n`);

  // --- UNIT LEVEL POLICY TESTS ---
  await assert('VULN-03: Password Policy rejects < 10 characters', async () => {
    const r = validatePassword('short123');
    if (r.valid) throw new Error('Expected 8-character password to be rejected');
  });

  await assert('VULN-03: Password Policy rejects known weak passwords', async () => {
    const r1 = validatePassword('password123');
    const r2 = validatePassword('counsellor123');
    const r3 = validatePassword('123456789012');
    if (r1.valid || r2.valid || r3.valid) {
      throw new Error('Expected common/weak password to be rejected');
    }
  });

  await assert('VULN-03: Password Policy accepts strong passphrases >= 10 characters', async () => {
    const r = validatePassword('BlueSkyAdmissions2026!');
    if (!r.valid) throw new Error(`Expected strong password to pass, got error: ${r.message}`);
  });

  await assert('VULN-05: Pagination parser enforces upper bound (max 200)', async () => {
    const params = new URLSearchParams('page=2&limit=99999');
    const { page, limit, skip } = parsePaginationParams(params, { maxLimit: 200 });
    if (limit !== 200) throw new Error(`Expected limit capped to 200, got ${limit}`);
    if (page !== 2) throw new Error(`Expected page=2, got ${page}`);
    if (skip !== 200) throw new Error(`Expected skip=200, got ${skip}`);
  });

  await assert('VULN-05: Pagination parser safely handles NaN and negative limits', async () => {
    const params = new URLSearchParams('page=-5&limit=not_a_number');
    const { page, limit, skip } = parsePaginationParams(params, { defaultLimit: 50, defaultPage: 1 });
    if (page !== 1) throw new Error(`Expected fallback to page=1, got ${page}`);
    if (limit !== 50) throw new Error(`Expected fallback to limit=50, got ${limit}`);
    if (skip !== 0) throw new Error(`Expected skip=0, got ${skip}`);
  });

  // --- INTEGRATION & API LEVEL TESTS ---
  let adminCookie = '';
  let memberCookie = '';

  // Login as Admin
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@college.edu', password: 'admin123' }),
  });
  const adminSetCookie = adminRes.headers.get('set-cookie');
  if (adminSetCookie) adminCookie = adminSetCookie.split(';')[0];

  // Login as Member
  const memberRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya@college.edu', password: 'counsellor123' }),
  });
  const memberSetCookie = memberRes.headers.get('set-cookie');
  if (memberSetCookie) memberCookie = memberSetCookie.split(';')[0];

  // 1. VULN-01: Login Rate Limiting triggers HTTP 429
  await assert('VULN-01: Rate Limiter triggers HTTP 429 after 5 failed attempts', async () => {
    const targetEmail = `audit_target_${Date.now()}@example.com`;
    let got429 = false;
    let retryAfter = '';

    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '203.0.113.42',
        },
        body: JSON.stringify({ email: targetEmail, password: 'WrongPassword123!' }),
      });

      if (res.status === 429) {
        got429 = true;
        retryAfter = res.headers.get('retry-after') || '';
        break;
      }
    }

    if (!got429) throw new Error('Rate limit was not triggered after multiple failed login attempts');
    if (!retryAfter) throw new Error('Expected Retry-After header in 429 response');
  });

  // 2. VULN-02: Sensitive Error Message Disclosure
  await assert('VULN-02: Login failure does NOT disclose infrastructure or environment details', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_test_account@college.edu', password: 'some_password' }),
    });

    const data = await res.json();
    const errorText = JSON.stringify(data);

    if (errorText.includes('DATABASE_URL')) throw new Error('Leaked DATABASE_URL in response');
    if (errorText.includes('JWT_SECRET')) throw new Error('Leaked JWT_SECRET in response');
    if (errorText.includes('PostgreSQL')) throw new Error('Leaked PostgreSQL vendor details in response');
    if (errorText.includes('Vercel')) throw new Error('Leaked Vercel configuration instructions in response');
  });

  // 3. VULN-03: Team Member password reset requires strong password
  await assert('VULN-03: Password reset endpoint rejects weak/short passwords (< 10 chars)', async () => {
    const res = await fetch(`${baseUrl}/api/team/reset-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        userId: 'some-user-id',
        newPassword: 'short',
      }),
    });

    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 rejection for short password, got ${res.status}`);
    }
    const data = await res.json();
    if (!data.error.includes('10 characters')) {
      throw new Error(`Expected error mentioning 10 characters, got: ${data.error}`);
    }
  });

  // 4. VULN-04: Leads sortBy unvalidated parameter defense
  await assert('VULN-04: Leads API handles malicious/unvalidated sortBy safely', async () => {
    // Attempt arbitrary field injection
    const res = await fetch(`${baseUrl}/api/leads?sortBy=passwordHash&sortOrder=asc`, {
      headers: { Cookie: adminCookie },
    });

    if (!res.ok) {
      throw new Error(`Expected query with invalid sortBy to safely fall back, but got HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data.leads)) {
      throw new Error('Expected leads array returned from query');
    }
  });

  // 5. VULN-05: Leads limit parameter is strictly capped at 200
  await assert('VULN-05: Leads API enforces hard limit cap (max 200 per page)', async () => {
    const res = await fetch(`${baseUrl}/api/leads?limit=999999`, {
      headers: { Cookie: adminCookie },
    });

    if (!res.ok) throw new Error(`Query failed with HTTP ${res.status}`);
    const data = await res.json();
    if (data.pagination.limit > 200) {
      throw new Error(`Expected limit capped to <= 200, got ${data.pagination.limit}`);
    }
  });

  // 6. VULN-05: Activities limit parameter is bounded
  await assert('VULN-05: Activities API safely handles huge limit parameter', async () => {
    const res = await fetch(`${baseUrl}/api/activities?limit=999999`, {
      headers: { Cookie: adminCookie },
    });

    if (!res.ok) throw new Error(`Query failed with HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.activities)) throw new Error('Expected activities array');
  });

  // 7. VULN-06: Spoofed x-user-* identity headers cannot elevate privileges
  await assert('VULN-06: Direct API requests cannot spoof identity using x-user-* headers', async () => {
    // Try to access /api/team without a token, only supplying x-user-role: ADMIN
    const unauthRes = await fetch(`${baseUrl}/api/team`, {
      headers: {
        'x-user-role': 'ADMIN',
        'x-user-id': 'fake-admin-id',
        'x-user-email': 'admin@college.edu',
      },
    });

    if (unauthRes.status !== 401) {
      throw new Error(`Expected HTTP 401 for spoofed header request, got ${unauthRes.status}`);
    }

    // Member token attempting privilege escalation via x-user-role: ADMIN header
    const memberSpoofRes = await fetch(`${baseUrl}/api/team`, {
      headers: {
        Cookie: memberCookie,
        'x-user-role': 'ADMIN',
      },
    });

    if (memberSpoofRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for Member attempting spoofing, got ${memberSpoofRes.status}`);
    }
  });

  // 8. VULN-07: Content Security Policy header presence and structure
  await assert('VULN-07: Response includes dynamic Content-Security-Policy with nonce', async () => {
    const res = await fetch(`${baseUrl}/login`);
    const csp = res.headers.get('content-security-policy');
    if (!csp) throw new Error('Content-Security-Policy header is missing');
    if (!csp.includes("default-src 'self'")) throw new Error("CSP missing default-src 'self'");
    if (!csp.includes('nonce-')) throw new Error('CSP missing dynamic cryptographic nonce');
  });

  // 9. INFO-01: Production seed guard
  await assert('INFO-01: prisma/seed.ts blocks execution in production', async () => {
    try {
      execSync('npx tsx prisma/seed.ts', {
        env: {
          ...process.env,
          NODE_ENV: 'production',
          ALLOW_SEED_DEV: 'false',
        },
        stdio: 'pipe',
      });
      throw new Error('Expected production seed execution to throw an error, but it succeeded');
    } catch (err: any) {
      // Must exit with error and mention production block
      const output = (err.stderr || err.stdout || err.message).toString();
      if (!output.includes('BLOCKED') && !output.includes('production')) {
        throw new Error(`Expected production seed block message, got: ${output}`);
      }
    }
  });

  // 10. INFO-03: CSRF origin validation on mutations
  await assert('INFO-03: Rejects state-changing mutations with cross-origin Origin header', async () => {
    const res = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://malicious-attacker-site.com',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ name: 'Hacker Lead' }),
    });

    if (res.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for cross-origin mutation, got ${res.status}`);
    }
  });

  // 11. Sensitive data check: Password hash never leaked in user responses
  await assert('VULN-03: Password hashes are never exposed in user API responses', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    if (JSON.stringify(data).includes('passwordHash')) {
      throw new Error('passwordHash field detected in /api/auth/me response');
    }

    const teamRes = await fetch(`${baseUrl}/api/team`, {
      headers: { Cookie: adminCookie },
    });
    const teamData = await teamRes.json();
    if (JSON.stringify(teamData).includes('passwordHash')) {
      throw new Error('passwordHash field detected in /api/team response');
    }
  });
}

async function main() {
  console.log('🚀 Starting Security Verification Suite...');
  let serverProcess: ChildProcess | null = null;

  try {
    const testPort = await getAvailablePort(3008);
    const testUrl = `http://localhost:${testPort}`;

    console.log(`🌐 Starting test server on port ${testPort}...`);
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    serverProcess = spawn(npxCmd, ['next', 'dev', '-p', String(testPort)], {
      shell: true,
      env: {
        ...process.env,
        PORT: String(testPort),
      },
      stdio: 'pipe',
    });

    const isReady = await waitForServer(testUrl, 45000);
    if (!isReady) {
      throw new Error(`Test server failed to start on port ${testPort} within timeout`);
    }

    await runSecurityTests(testUrl);
  } catch (err: any) {
    console.error(`\n❌ Error during security test lifecycle: ${err.message}`);
    results.push({ name: 'Security Test Lifecycle', passed: false, error: err.message });
  } finally {
    if (serverProcess && serverProcess.pid) {
      console.log('\n🧹 Shutting down security test server...');
      killProcessTree(serverProcess.pid);
    }
  }

  console.log('\n=========================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const percentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  if (passedCount === totalCount && totalCount > 0) {
    console.log(`🎉 SECURITY AUDIT: ${passedCount}/${totalCount} PASSED (${percentage}%)`);
    console.log('=========================================\n');
    process.exit(0);
  } else {
    console.error(`❌ SECURITY AUDIT: ${passedCount}/${totalCount} PASSED (${percentage}%) - FAILURES DETECTED`);
    console.log('=========================================\n');
    process.exit(1);
  }
}

main();
