// /api/admin/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// GET /api/admin/users/[id]
// Obtiene un usuario por su ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await tursoClient.execute({
      sql: 'SELECT id, username, email, phone, first_name, last_name, is_active, is_verified, is_moderator, created_at, updated_at FROM users WHERE id = ?',
      args: [params.id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Error fetching user', error }, { status: 500 });
  }
}

// PUT /api/admin/users/[id]
// Actualiza un usuario por su ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { username, email, password, phone, first_name, last_name, is_active, is_verified, is_moderator } = await request.json();

    let sql: string;
    let args: any[];

    // Si se proporciona una nueva contraseña, la hasheamos y la incluimos
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql = `
        UPDATE users SET 
          username = ?, 
          email = ?, 
          password = ?, 
          phone = ?, 
          first_name = ?, 
          last_name = ?, 
          is_active = ?, 
          is_verified = ?, 
          is_moderator = ?, 
          updated_at = datetime("now", "localtime") 
        WHERE id = ?
      `;
      args = [username, email, hashedPassword, phone, first_name, last_name, is_active, is_verified, is_moderator, params.id];
    } else {
      sql = `
        UPDATE users SET 
          username = ?, 
          email = ?, 
          phone = ?, 
          first_name = ?, 
          last_name = ?, 
          is_active = ?, 
          is_verified = ?, 
          is_moderator = ?, 
          updated_at = datetime("now", "localtime") 
        WHERE id = ?
      `;
      args = [username, email, phone, first_name, last_name, is_active, is_verified, is_moderator, params.id];
    }
    
    const result = await tursoClient.execute({
      sql,
      args
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ message: 'User not found or no changes made' }, { status: 404 });
    }

    // Obtener el usuario actualizado
    const updatedUserResult = await tursoClient.execute({
      sql: 'SELECT id, username, email, phone, first_name, last_name, is_active, is_verified, is_moderator, created_at, updated_at FROM users WHERE id = ?',
      args: [params.id]
    });

    const updatedUser = updatedUserResult.rows[0];
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Manejo específico de errores de Turso
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { error: 'Username o email ya existe' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json({ message: 'Error updating user', error }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]
// Elimina un usuario por su ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await tursoClient.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [params.id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Manejo específico de errores de constraint (si el usuario tiene datos relacionados)
    if (error instanceof Error) {
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return NextResponse.json(
          { error: 'No se puede eliminar el usuario porque tiene datos relacionados' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json({ message: 'Error deleting user', error }, { status: 500 });
  }
}