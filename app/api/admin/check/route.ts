// app/api/admin/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@libsql/client';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        isAdmin: false, 
        error: 'No autenticado' 
      }, { status: 401 });
    }

    const userResult = await tursoClient.execute({
      sql: 'SELECT id, is_moderator, username FROM users WHERE email = ?',
      args: [session.user.email]
    });

    const user = userResult.rows[0];

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