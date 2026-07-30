import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendNotificationEmail } from '@/lib/resend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // 1. Save message into Neon Postgres Database via Prisma
    const savedMessage = await db.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject ? subject.trim() : null,
        message: message.trim(),
        status: 'UNREAD',
      },
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
      {
        success: true,
        message: 'Transmission received and logged to database.',
        data: savedMessage,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // `unknown` rather than `any`: a thrown value is not guaranteed to be an Error, and
    // reading .message off a non-Error would itself throw inside the handler.
    const message = error instanceof Error ? error.message : String(error);
    console.error('Contact API Error:', message);
    if (error instanceof Error) {
      console.error('Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
    return NextResponse.json(
      { error: 'Internal Server Error while saving message.', details: message },
      { status: 500 }
    );
  }
}
