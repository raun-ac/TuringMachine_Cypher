import { NextResponse } from 'next/server';

let globalState = {
  orders: [],
  inventory: null,
  riderOnline: true,
  lastUpdated: 0
};

export async function GET() {
  return NextResponse.json({ data: globalState });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (body.data) {
      globalState = body.data;
    }
    return NextResponse.json({ success: true, data: globalState });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
