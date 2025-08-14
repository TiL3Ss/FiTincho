// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Obtener el usuario actual
    const currentUserResult = await tursoClient.execute({
      sql: 'SELECT id, username, email, first_name, last_name, is_moderator FROM users WHERE email = ?',
      args: [session.user.email]
    });

    const currentUser = currentUserResult.rows[0];

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Si se especifica un userId y el usuario actual es moderador, obtener ese perfil
    // Si no, obtener el perfil del usuario actual
    let targetUserId = currentUser.id;
    if (userId && currentUser.is_moderator === 1) {
      targetUserId = parseInt(userId);
    }

    // Obtener el perfil del usuario objetivo
    const profileUserResult = await tursoClient.execute({
      sql: 'SELECT id, username, email, first_name, last_name, is_moderator, created_at FROM users WHERE id = ?',
      args: [targetUserId]
    });

    const profileUser = profileUserResult.rows[0];

    if (!profileUser) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    // Construir nombre de display
    const displayName = profileUser.first_name && profileUser.last_name 
      ? `${profileUser.first_name} ${profileUser.last_name}`
      : profileUser.first_name || profileUser.username;

    // Obtener estadísticas del usuario - conteo de rutinas
    const routineCountResult = await tursoClient.execute({
      sql: 'SELECT COUNT(DISTINCT week_number || day_name) as total FROM routines WHERE user_id = ? AND is_active = 1',
      args: [targetUserId]
    });

    // Obtener estadísticas del usuario - conteo de ejercicios
    const exerciseCountResult = await tursoClient.execute({
      sql: `SELECT COUNT(*) as total 
           FROM routine_exercises re 
           JOIN routines r ON re.routine_id = r.id 
           WHERE r.user_id = ? AND r.is_active = 1`,
      args: [targetUserId]
    });

    const routineCount = routineCountResult.rows[0];
    const exerciseCount = exerciseCountResult.rows[0];

    return NextResponse.json({
      user: {
        id: profileUser.id.toString(),
        username: profileUser.username,
        email: profileUser.email,
        name: displayName,
        firstName: profileUser.first_name,
        lastName: profileUser.last_name,
        isModerator: profileUser.is_moderator === 1,
        createdAt: profileUser.created_at
      },
      stats: {
        routines: routineCount?.total || 0,
        exercises: exerciseCount?.total || 0
      },
      isOwnProfile: currentUser.id === profileUser.id,
      canEdit: currentUser.is_moderator === 1 || currentUser.id === profileUser.id
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email } = body;

    // Obtener el usuario actual
    const currentUserResult = await tursoClient.execute({
      sql: 'SELECT id, username, email, is_moderator FROM users WHERE email = ?',
      args: [session.user.email]
    });

    const currentUser = currentUserResult.rows[0];

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Validar datos de entrada
    if (email && email !== currentUser.email) {
      // Verificar que el nuevo email no esté en uso
      const existingUserResult = await tursoClient.execute({
        sql: 'SELECT id FROM users WHERE email = ? AND id != ?',
        args: [email, currentUser.id]
      });

      if (existingUserResult.rows.length > 0) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 409 });
      }
    }

    // Actualizar el perfil
    await tursoClient.execute({
      sql: 'UPDATE users SET first_name = ?, last_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [firstName || null, lastName || null, email || currentUser.email, currentUser.id]
    });

    // Obtener el usuario actualizado
    const updatedUserResult = await tursoClient.execute({
      sql: 'SELECT id, username, email, first_name, last_name, is_moderator FROM users WHERE id = ?',
      args: [currentUser.id]
    });

    const updatedUser = updatedUserResult.rows[0];

    const displayName = updatedUser.first_name && updatedUser.last_name 
      ? `${updatedUser.first_name} ${updatedUser.last_name}`
      : updatedUser.first_name || updatedUser.username;

    return NextResponse.json({
      user: {
        id: updatedUser.id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        name: displayName,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        isModerator: updatedUser.is_moderator === 1
      },
      message: 'Perfil actualizado correctamente'
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}