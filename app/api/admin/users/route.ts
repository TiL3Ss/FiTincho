// /api/admin/users/route.ts

import { getDb } from '../../../lib/db_ticho';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await getDb();
    const users = await db.all('SELECT * FROM users');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Error fetching users', error }, { status: 500 });
  }
}