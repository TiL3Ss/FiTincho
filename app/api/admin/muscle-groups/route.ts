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
      sql: 'SELECT * FROM muscle_groups',
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
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Missing required field: name' }, { status: 400 });
    }

    const result = await tursoClient.execute({
      sql: 'INSERT INTO muscle_groups (name) VALUES (?)',
      args: [name]
    });

    const newMuscleGroupResult = await tursoClient.execute({
      sql: 'SELECT * FROM muscle_groups WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    const newMuscleGroup = newMuscleGroupResult.rows[0];

    return NextResponse.json(newMuscleGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating muscle group:', error);
    return NextResponse.json({ message: 'Error creating muscle group', error }, { status: 500 });
  }
}