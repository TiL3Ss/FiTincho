// /api/test-turso.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../lib/turso';

export async function GET() {
  try {
    const client = getTursoClient();
    const result = await client.execute('SELECT 1 as test');
    
    return NextResponse.json({ 
      success: true, 
      result: result.rows,
      env_check: {
        has_url: !!process.env.TURSO_DATABASE_URL,
        has_token: !!process.env.TURSO_AUTH_TOKEN
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}