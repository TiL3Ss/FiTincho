// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db_ticho';
import bcrypt from 'bcryptjs';

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

    const db = await getDb();

    // Buscar el usuario con el token válido
    const user = await db.get(
      `SELECT id, email, username, reset_token_expiry 
       FROM users 
       WHERE reset_token = ? AND reset_token_expiry > datetime('now')`,
      [token]
    );

    if (!user) {
      return NextResponse.json(
        { message: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.' },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y limpiar el token
    await db.run(
      `UPDATE users 
       SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    return NextResponse.json(
      { 
        message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en reset-password:', error);
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

    const db = await getDb();

    // Verificar si el token es válido
    const user = await db.get(
      `SELECT id FROM users 
       WHERE reset_token = ? AND reset_token_expiry > datetime('now')`,
      [token]
    );

    if (!user) {
      return NextResponse.json(
        { message: 'Token inválido o expirado.', valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Token válido.', valid: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error validando token:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor.', valid: false },
      { status: 500 }
    );
  }
}