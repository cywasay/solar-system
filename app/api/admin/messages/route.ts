import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123secret';

  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    return false;
  }
  return true;
}

// GET /api/admin/messages - Fetch all contact messages
export async function GET(req: Request) {
  if (!authenticateAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// PATCH /api/admin/messages - Update message status
export async function PATCH(req: Request) {
  if (!authenticateAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    const updated = await db.contactMessage.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error) {
    console.error('Update Message Error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
