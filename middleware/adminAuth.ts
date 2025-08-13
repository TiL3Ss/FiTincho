// middleware/adminAuth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { getDb } from '../app/lib/db_ticho';

export async function adminAuth(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = await getDb();
    const user = await db.get(
      'SELECT id, is_moderator FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!user || user.is_moderator !== 1) {
      return NextResponse.json({ 
        error: 'Acceso denegado. Se requieren permisos de administrador.' 
      }, { status: 403 });
    }

    return null; // null significa que la verificación fue exitosa
  } catch (error) {
    console.error('Error en adminAuth middleware:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}