// api/admin/routine-muscle-groups/route.ts
import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Obtiene todas las relaciones de rutina-grupos musculares, con los nombres de rutina y grupo muscular
export async function GET() {
  try {
    const routineMuscleGroupsResult = await tursoClient.execute({
      sql: `
        SELECT 
          rmg.id,
          rmg.routine_id,
          rmg.muscle_group_id,
          mg.name AS muscle_group_name,
          u.first_name || ' ' || u.last_name || ' - Semana ' || r.week_number || ' - ' || r.day_name AS routine_info,
          rmg.created_at
        FROM routine_muscle_groups AS rmg
        JOIN routines AS r ON rmg.routine_id = r.id
        JOIN muscle_groups AS mg ON rmg.muscle_group_id = mg.id
        JOIN users AS u ON r.user_id = u.id
      `,
      args: []
    });

    const routineMuscleGroups = routineMuscleGroupsResult.rows;
    
    return NextResponse.json(routineMuscleGroups);
  } catch (error) {
    console.error('Error fetching routine muscle groups:', error);
    return NextResponse.json({ message: 'Error fetching routine muscle groups', error }, { status: 500 });
  }
}

// POST /api/admin/routine-muscle-groups
// Crea una nueva relación de rutina-grupo muscular
export async function POST(request: Request) {
  try {
    const { routine_id, muscle_group_id } = await request.json();

    if (!routine_id || !muscle_group_id) {
      return NextResponse.json({ message: 'Missing required fields: routine_id and muscle_group_id' }, { status: 400 });
    }

    // Verificar si la relación ya existe para evitar duplicados
    const existingRelationResult = await tursoClient.execute({
      sql: 'SELECT id FROM routine_muscle_groups WHERE routine_id = ? AND muscle_group_id = ?',
      args: [routine_id, muscle_group_id]
    });

    if (existingRelationResult.rows.length > 0) {
      return NextResponse.json({ message: 'This routine-muscle group relationship already exists' }, { status: 409 });
    }

    const result = await tursoClient.execute({
      sql: 'INSERT INTO routine_muscle_groups (routine_id, muscle_group_id) VALUES (?, ?)',
      args: [routine_id, muscle_group_id]
    });

    const newRoutineMuscleGroupResult = await tursoClient.execute({
      sql: 'SELECT * FROM routine_muscle_groups WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    const newRoutineMuscleGroup = newRoutineMuscleGroupResult.rows[0];

    return NextResponse.json(newRoutineMuscleGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating routine muscle group:', error);
    return NextResponse.json({ message: 'Error creating routine muscle group', error }, { status: 500 });
  }
}