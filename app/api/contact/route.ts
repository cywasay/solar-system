import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendNotificationEmail } from '@/lib/resend';
import { CONTACT_LIMITS } from '@/lib/contactLimits';
import { clientIp, createRateLimiter } from '@/lib/rateLimit';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Per-IP, best-effort — see lib/rateLimit.ts for what it does and doesn't stop. */
const submissions = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  const ip = clientIp(req);
  const wait = submissions.retryAfter(ip);
  if (wait > 0) {
    return NextResponse.json(
      { error: 'Too many messages. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(wait) } }
    );
  }
  submissions.record(ip);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object') return badRequest('Invalid request body.');
    body = parsed as Record<string, unknown>;
  } catch {
    return badRequest('Invalid request body.');
  }

  // Honeypot: a field hidden from people but filled in by naive bots. Pretend success so
  // the bot has no signal to adapt to, but store and send nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  // typeof checks first: a non-string field would otherwise throw on .trim() and 500.
  const field = (key: string) => (typeof body[key] === 'string' ? (body[key] as string).trim() : '');
  const name = field('name');
  const email = field('email').toLowerCase();
  const subject = field('subject');
  const message = field('message');

  if (!name || !email || !message) {
    return badRequest('Name, email, and message are required.');
  }
  if (!EMAIL_PATTERN.test(email)) {
    return badRequest('Please enter a valid email address.');
  }
  if (
    name.length > CONTACT_LIMITS.name ||
    email.length > CONTACT_LIMITS.email ||
    subject.length > CONTACT_LIMITS.subject ||
    message.length > CONTACT_LIMITS.message
  ) {
    return badRequest(
      `Too long. Limits: name ${CONTACT_LIMITS.name}, subject ${CONTACT_LIMITS.subject}, message ${CONTACT_LIMITS.message} characters.`
    );
  }

  try {
    // 1. Save message into Neon Postgres Database via Prisma
    const savedMessage = await db.contactMessage.create({
      data: { name, email, subject: subject || null, message, status: 'UNREAD' },
    });

    // 2. Notify the site owner. Non-blocking, and a no-op while email is disabled —
    //    the submission is already saved, so mail must never affect this response.
    void sendNotificationEmail({
      name: savedMessage.name,
      email: savedMessage.email,
      subject: savedMessage.subject || undefined,
      message: savedMessage.message,
    }).catch((err) => console.error('Email dispatch error:', err));

    return NextResponse.json(
      { success: true, message: 'Transmission received and logged to database.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Full detail goes to the server log only — the client gets a generic message, since
    // raw database errors can expose table names, hosts, and driver internals.
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while saving message.' },
      { status: 500 }
    );
  }
}
