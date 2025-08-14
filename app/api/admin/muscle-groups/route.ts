// /api/admin/muscle-groups/route.ts

import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Obtiene todos los grupos musculares
export async function GET() {
  try {
    const muscleGroupsResult = await tursoClient.execute({
      sql: 'SELECT * FROM muscle_groups ORDER BY name ASC',
      args: []
    });
    
    const muscleGroups = muscleGroupsResult.rows;
    
    return NextResponse.json(muscleGroups);
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    return NextResponse.json({ message: 'Error fetching muscle groups', error }, { status: 500 });
  }
}

// POST /api/admin/muscle-groups
// Crea un nuevo grupo muscular
export async function POST(request: Request) {
  try {
    const { name, color_gm } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'El nombre del grupo muscular es requerido' }, { status: 400 });
    }

    // Verificar si ya existe un grupo con el mismo nombre
    const existingGroupResult = await tursoClient.execute({
      sql: 'SELECT id FROM muscle_groups WHERE LOWER(name) = LOWER(?)',
      args: [name.trim()]
    });

    if (existingGroupResult.rows.length > 0) {
      return NextResponse.json({ message: 'Ya existe un grupo muscular con este nombre' }, { status: 400 });
    }

    // Insertar el nuevo grupo muscular
    const result = await tursoClient.execute({
      sql: 'INSERT INTO muscle_groups (name, color_gm) VALUES (?, ?)',
      args: [name.trim(), color_gm || 'ocean']
    });

    // Obtener el grupo recién creado
    const newMuscleGroupResult = await tursoClient.execute({
      sql: 'SELECT * FROM muscle_groups WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    const newMuscleGroup = newMuscleGroupResult.rows[0];

    return NextResponse.json(newMuscleGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating muscle group:', error);
    return NextResponse.json({ message: 'Error al crear el grupo muscular', error }, { status: 500 });
  }
}