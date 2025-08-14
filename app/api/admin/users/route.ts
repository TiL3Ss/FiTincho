// /api/admin/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// GET /api/admin/users
// Obtiene todos los usuarios con paginación opcional
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'DESC';
    
    // Validar parámetros de ordenamiento
    const validSortFields = ['id', 'username', 'email', 'first_name', 'last_name', 'created_at', 'updated_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    const offset = (page - 1) * limit;
    
    let sql: string;
    let args: any[];
    
    if (search) {
      // Búsqueda con filtros
      sql = `
        SELECT id, username, email, phone, first_name, last_name, 
               is_active, is_verified, is_moderator, created_at, updated_at 
        FROM users 
        WHERE username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?
        ORDER BY ${finalSortBy} ${finalSortOrder}
        LIMIT ? OFFSET ?
      `;
      const searchPattern = `%${search}%`;
      args = [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset];
    } else {
      // Obtener todos los usuarios
      sql = `
        SELECT id, username, email, phone, first_name, last_name, 
               is_active, is_verified, is_moderator, created_at, updated_at 
        FROM users 
        ORDER BY ${finalSortBy} ${finalSortOrder}
        LIMIT ? OFFSET ?
      `;
      args = [limit, offset];
    }
    
    const result = await tursoClient.execute({ sql, args });
    
    // Obtener el conteo total para la paginación
    let countSql: string;
    let countArgs: any[];
    
    if (search) {
      countSql = `
        SELECT COUNT(*) as total 
        FROM users 
        WHERE username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?
      `;
      const searchPattern = `%${search}%`;
      countArgs = [searchPattern, searchPattern, searchPattern, searchPattern];
    } else {
      countSql = 'SELECT COUNT(*) as total FROM users';
      countArgs = [];
    }
    
    const countResult = await tursoClient.execute({
      sql: countSql,
      args: countArgs
    });
    
    const total = countResult.rows[0].total as number;
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Error fetching users', error }, { status: 500 });
  }
}

// POST /api/admin/users
// Crea un nuevo usuario (función adicional que podrías necesitar)
export async function POST(request: NextRequest) {
  try {
    const { username, email, password, phone, first_name, last_name, is_active = true, is_verified = false, is_moderator = false } = await request.json();
    
    // Validaciones básicas
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email y password son requeridos' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario ya existe
    const existingUserResult = await tursoClient.execute({
      sql: 'SELECT id FROM users WHERE username = ? OR email = ?',
      args: [username, email]
    });
    
    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Usuario o email ya existe' },
        { status: 409 }
      );
    }
    
    // Hash de la contraseña
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear el usuario
    const result = await tursoClient.execute({
      sql: `
        INSERT INTO users (
          username, email, password, phone, first_name, last_name,
          is_active, is_verified, is_moderator, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now", "localtime"), datetime("now", "localtime"))
      `,
      args: [username, email, hashedPassword, phone, first_name, last_name, is_active, is_verified, is_moderator]
    });
    
    // Obtener el usuario creado
    const newUserResult = await tursoClient.execute({
      sql: 'SELECT id, username, email, phone, first_name, last_name, is_active, is_verified, is_moderator, created_at, updated_at FROM users WHERE id = ?',
      args: [result.lastInsertRowid]
    });
    
    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      user: newUserResult.rows[0]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Manejo específico de errores
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { error: 'Username o email ya existe' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Error creating user', error },
      { status: 500 }
    );
  }
}