import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateAdmin } from '@/lib/adminAuth';

/** The column is a plain String, so the allowed values are enforced here. */
const STATUSES = new Set(['UNREAD', 'READ', 'REPLIED']);

// GET /api/admin/messages - Fetch all contact messages
export async function GET() {
  if (!(await authenticateAdmin())) {
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
  if (!(await authenticateAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (typeof id !== 'string' || !id || typeof status !== 'string' || !STATUSES.has(status)) {
      return NextResponse.json(
        { error: 'ID and a status of UNREAD, READ or REPLIED are required' },
        { status: 400 }
      );
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
