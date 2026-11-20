import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendReplyEmail } from '@/lib/resend';
import { authenticateAdmin } from '@/lib/adminAuth';
import { CONTACT_LIMITS } from '@/lib/contactLimits';

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

/*
 * POST /api/admin/reply
 *
 * A message is only marked REPLIED once the customer has actually been written to. If the
 * email can't go out (not configured, rejected by Resend, ...) nothing is recorded and the
 * response says why, so the inbox never claims a reply that no one received.
 *
 * `recordOnly: true` is the explicit escape hatch for "I'll send this myself": the reply is
 * stored and the message marked REPLIED without any email being attempted.
 */
export async function POST(req: Request) {
  if (!(await authenticateAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object') return badRequest('Invalid request body.');
    body = parsed as Record<string, unknown>;
  } catch {
    return badRequest('Invalid request body.');
  }

  // typeof first: a non-string would otherwise reach Prisma or the email template and 500.
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const replyText = typeof body.replyText === 'string' ? body.replyText.trim() : '';
  const recordOnly = body.recordOnly === true;

  if (!id || !replyText) return badRequest('Message ID and reply text are required');
  if (replyText.length > CONTACT_LIMITS.reply) {
    return badRequest(`Reply is too long (limit ${CONTACT_LIMITS.reply} characters).`);
  }

  try {
    const message = await db.contactMessage.findUnique({ where: { id } });
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (!recordOnly) {
      const emailResult = await sendReplyEmail(
        message.email,
        message.name,
        replyText,
        message.subject || undefined
      );

      if (!emailResult.sent) {
        // 502: the request was fine, the thing we depend on (the mail provider) wasn't.
        // The inbox is left untouched.
        return NextResponse.json(
          {
            error: 'The email was not sent, so the message has not been marked as replied.',
            emailSent: false,
            reason: emailResult.reason ?? 'Unknown email error',
          },
          { status: 502 }
        );
      }
    }

    try {
      const updated = await db.contactMessage.update({
        where: { id },
        data: { status: 'REPLIED', replyText },
      });
      return NextResponse.json({ success: true, message: updated, emailSent: !recordOnly });
    } catch (error) {
      console.error('Record Reply Error:', error);
      // The email already left. Say so, so the admin doesn't send it a second time.
      return NextResponse.json(
        {
          error: recordOnly
            ? 'Failed to record the reply.'
            : 'The email WAS sent, but recording it failed. Do not send it again — mark the message as replied manually.',
          emailSent: !recordOnly,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send Reply Error:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
