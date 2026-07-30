import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendReplyEmail } from '@/lib/resend';

function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123secret';

  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  if (!authenticateAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, replyText } = await req.json();

    if (!id || !replyText) {
      return NextResponse.json({ error: 'Message ID and reply text are required' }, { status: 400 });
    }

    const message = await db.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // 1. Send reply email via Resend
    const emailResult = await sendReplyEmail(
      message.email,
      message.name,
      replyText,
      message.subject || undefined
    );

    // 2. Update status in database
    const updated = await db.contactMessage.update({
      where: { id },
      data: {
        status: 'REPLIED',
        replyText: replyText,
      },
    });

    return NextResponse.json({
      success: true,
      message: updated,
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error('Send Reply Error:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
