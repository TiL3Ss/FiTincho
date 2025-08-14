// app/api/users/profile/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el usuario actual
    const currentUserResult = await tursoClient.execute({
      sql: 'SELECT id, username, email, first_name, last_name, is_moderator FROM users WHERE email = ?',
      args: [session.user.email]
    });

    const currentUser = currentUserResult.rows[0];

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Si es moderador, devolver todos los usuarios activos
    // Si no es moderador, solo devolver su propio usuario
    let users: any[];
    
    if (currentUser.is_moderator === 1) {
      const usersResult = await tursoClient.execute({
        sql: `SELECT 
          id, 
          username,
          first_name,
          last_name,
          email,
          COALESCE(
            CASE 
              WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
              THEN first_name || ' ' || last_name
              WHEN first_name IS NOT NULL 
              THEN first_name
              ELSE username
            END, 
            username
          ) as display_name
        FROM users 
        WHERE is_active = 1 
        ORDER BY username`,
        args: []
      });
      users = usersResult.rows;
    } else {
      const displayName = currentUser.first_name && currentUser.last_name 
        ? `${currentUser.first_name} ${currentUser.last_name}`
        : currentUser.first_name || currentUser.username;
        
      users = [{
        id: currentUser.id,
        username: currentUser.username,
        display_name: displayName
      }];
    }

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id.toString(),
        name: user.display_name || user.username,
        username: user.username
      })),
      currentUser: {
        id: currentUser.id,
        username: currentUser.username,
        isModerator: currentUser.is_moderator === 1
      }
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}