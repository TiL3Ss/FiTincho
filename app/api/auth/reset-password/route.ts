// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    // Validación de campos
    if (!token || !newPassword) {
      return NextResponse.json(
        { message: 'Token y nueva contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    // Validación de la contraseña
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    // Buscar el usuario con el token válido
    const userResult = await tursoClient.execute({
      sql: `SELECT id, email, username, reset_token_expiry 
            FROM users 
            WHERE reset_token = ? AND reset_token_expiry > datetime('now')`,
      args: [token]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.' },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y limpiar el token
    const updateResult = await tursoClient.execute({
      sql: `UPDATE users 
            SET password = ?, reset_token = NULL, reset_token_expiry = NULL 
            WHERE id = ?`,
      args: [hashedPassword, user.id]
    });

    // Verificar que se actualizó correctamente
    if (updateResult.rowsAffected === 0) {
      return NextResponse.json(
        { message: 'Error al actualizar la contraseña. Inténtalo de nuevo.' },
        { status: 500 }
      );
    }

    console.log(`✅ Contraseña actualizada exitosamente para usuario: ${user.username} (${user.email})`);

    return NextResponse.json(
      { 
        message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en reset-password:', error);
    
    // Manejo específico de errores de Turso
    if (error instanceof Error) {
      if (error.message.includes('SQLITE_READONLY')) {
        return NextResponse.json(
          { message: 'Error de configuración de base de datos.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('no such table')) {
        return NextResponse.json(
          { message: 'Error de configuración de base de datos.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('no such column')) {
        return NextResponse.json(
          { message: 'Error de estructura de base de datos.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

// GET para validar token (opcional - para verificar si el token es válido antes de mostrar el formulario)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Token no proporcionado.' },
        { status: 400 }
      );
    }

    // Verificar si el token es válido
    const userResult = await tursoClient.execute({
      sql: `SELECT id, username FROM users 
            WHERE reset_token = ? AND reset_token_expiry > datetime('now')`,
      args: [token]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Token inválido o expirado.', valid: false },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];
    console.log(`✅ Token válido para usuario: ${user.username}`);

    return NextResponse.json(
      { message: 'Token válido.', valid: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error validando token:', error);
    
    // Manejo específico de errores de Turso
    if (error instanceof Error) {
      if (error.message.includes('SQLITE_READONLY')) {
        return NextResponse.json(
          { message: 'Error de configuración de base de datos.', valid: false },
          { status: 500 }
        );
      }
      
      if (error.message.includes('no such table')) {
        return NextResponse.json(
          { message: 'Error de configuración de base de datos.', valid: false },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Error interno del servidor.', valid: false },
      { status: 500 }
    );
  }
}