// /api/admin/muscle-groups/route.ts

import { getDb } from '../../../lib/db_ticho';
import { NextResponse } from 'next/server';

// Obtiene todos los grupos musculares
export async function GET() {
  try {
    const db = await getDb();
    const muscleGroups = await db.all('SELECT * FROM muscle_groups');
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
    const db = await getDb();
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Missing required field: name' }, { status: 400 });
    }

    const result = await db.run('INSERT INTO muscle_groups (name) VALUES (?)', [name]);

    const newMuscleGroup = await db.get('SELECT * FROM muscle_groups WHERE id = ?', result.lastID);

    return NextResponse.json(newMuscleGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating muscle group:', error);
    return NextResponse.json({ message: 'Error creating muscle group', error }, { status: 500 });
  }
}