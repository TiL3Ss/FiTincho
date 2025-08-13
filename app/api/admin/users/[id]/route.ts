// /api/admin/users/[id]/route.ts

import { getDb } from '../../../../lib/db_ticho';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // Asumimos que tienes bcryptjs instalado para hashear contraseñas

// Obtiene un usuario por su ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const user = await db.get(
      'SELECT id, username, email, phone, first_name, last_name, is_active, is_verified, is_moderator, created_at, updated_at FROM users WHERE id = ?',
      params.id
    );

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Error fetching user', error }, { status: 500 });
  }
}

// PUT /api/admin/users/[id]
// Actualiza un usuario por su ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const { username, email, password, phone, first_name, last_name, is_active, is_verified, is_moderator } = await request.json();

    let sql = 'UPDATE users SET username = ?, email = ?, phone = ?, first_name = ?, last_name = ?, is_active = ?, is_verified = ?, is_moderator = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    let paramsArray = [username, email, phone, first_name, last_name, is_active, is_verified, is_moderator, params.id];

    // Si se proporciona una nueva contraseña, la hasheamos y la incluimos en la actualización
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql = 'UPDATE users SET username = ?, email = ?, password = ?, phone = ?, first_name = ?, last_name = ?, is_active = ?, is_verified = ?, is_moderator = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      paramsArray = [username, email, hashedPassword, phone, first_name, last_name, is_active, is_verified, is_moderator, params.id];
    }
    
    const result = await db.run(sql, paramsArray);

    if (result.changes === 0) {
      return NextResponse.json({ message: 'User not found or no changes made' }, { status: 404 });
    }

    const updatedUser = await db.get(
      'SELECT id, username, email, phone, first_name, last_name, is_active, is_verified, is_moderator, created_at, updated_at FROM users WHERE id = ?',
      params.id
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Error updating user', error }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]
// Elimina un usuario por su ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const result = await db.run('DELETE FROM users WHERE id = ?', params.id);

    if (result.changes === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Error deleting user', error }, { status: 500 });
  }
}