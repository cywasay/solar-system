import { NextResponse } from 'next/server';
import {
  configuredAdminPassword,
  endAdminSession,
  passwordMatches,
  startAdminSession,
} from '@/lib/adminAuth';
import { clientIp, createRateLimiter } from '@/lib/rateLimit';

/** Failed sign-ins only: a correct password always gets through once the window allows. */
const failedLogins = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

// POST /api/admin/session - Exchange the admin password for a session cookie
export async function POST(req: Request) {
  const ip = clientIp(req);
  const wait = failedLogins.retryAfter(ip);
  if (wait > 0) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(wait) } }
    );
  }

  const password = configuredAdminPassword();
  if (!password) {
    return NextResponse.json(
      { error: 'Admin access is not configured on the server.' },
      { status: 503 }
    );
  }

  let candidate = '';
  try {
    const body: unknown = await req.json();
    if (body && typeof body === 'object' && typeof (body as { password?: unknown }).password === 'string') {
      candidate = (body as { password: string }).password.trim();
    }
  } catch {
    // Fall through: an unreadable body is just a wrong password.
  }

  if (!candidate || !passwordMatches(candidate, password)) {
    failedLogins.record(ip);
    return NextResponse.json({ error: 'That key was not accepted.' }, { status: 401 });
  }

  failedLogins.reset(ip);
  await startAdminSession(password);
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/session - Sign out (clears this browser's cookie)
export async function DELETE() {
  await endAdminSession();
  return NextResponse.json({ success: true });
}
