import { NextRequest, NextResponse } from 'next/server';
import { unlockLead } from '@/app/actions';
import { getCallerSession } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getCallerSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    let leadId: number | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      leadId = Number(body.leadId);
    } else {
      const text = await req.text();
      try {
        const body = JSON.parse(text);
        leadId = Number(body.leadId);
      } catch {
        const match = text.match(/"leadId":\s*(\d+)/) || text.match(/leadId=(\d+)/);
        if (match && match[1]) {
          leadId = Number(match[1]);
        }
      }
    }

    if (!leadId || isNaN(leadId)) {
      return NextResponse.json({ success: false, error: 'INVALID_LEAD_ID' }, { status: 400 });
    }

    const res = await unlockLead(leadId, session.name);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
