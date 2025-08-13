// app/api/admin/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDb } from '../../../lib/db_ticho';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        isAdmin: false, 
        error: 'No autenticado' 
      }, { status: 401 });
    }

    const db = await getDb();
    const user = await db.get(
      'SELECT id, is_moderator, username FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!user) {
      return NextResponse.json({ 
        isAdmin: false, 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }

    const isAdmin = user.is_moderator === 1;

    return NextResponse.json({
      isAdmin,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: session.user.email
      }
    });

  } catch (error) {
    console.error('Error al verificar permisos de admin:', error);
    return NextResponse.json({ 
      isAdmin: false,
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}