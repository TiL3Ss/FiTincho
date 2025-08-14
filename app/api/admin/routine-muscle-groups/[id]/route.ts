// /api/admin/routine-muscle-groups/[id]/route.ts

import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Actualiza una relación de rutina-grupo muscular por su ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { routine_id, muscle_group_id } = await request.json();

    if (!routine_id || !muscle_group_id) {
      return NextResponse.json({ message: 'Missing required fields: routine_id and muscle_group_id' }, { status: 400 });
    }

    // Verificar si la nueva relación ya existe para evitar duplicados, excluyendo el ID actual
    const existingRelationResult = await tursoClient.execute({
      sql: 'SELECT id FROM routine_muscle_groups WHERE routine_id = ? AND muscle_group_id = ? AND id != ?',
      args: [routine_id, muscle_group_id, params.id]
    });

    if (existingRelationResult.rows.length > 0) {
      return NextResponse.json({ message: 'This routine-muscle group relationship already exists' }, { status: 409 });
    }

    const result = await tursoClient.execute({
      sql: 'UPDATE routine_muscle_groups SET routine_id = ?, muscle_group_id = ? WHERE id = ?',
      args: [routine_id, muscle_group_id, params.id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ message: 'Routine muscle group relationship not found or no changes made' }, { status: 404 });
    }

    const updatedRoutineMuscleGroupResult = await tursoClient.execute({
      sql: 'SELECT * FROM routine_muscle_groups WHERE id = ?',
      args: [params.id]
    });

    const updatedRoutineMuscleGroup = updatedRoutineMuscleGroupResult.rows[0];

    return NextResponse.json(updatedRoutineMuscleGroup);
  } catch (error) {
    console.error('Error updating routine muscle group:', error);
    return NextResponse.json({ message: 'Error updating routine muscle group', error }, { status: 500 });
  }
}

// DELETE /api/admin/routine-muscle-groups/[id]
// Elimina una relación de rutina-grupo muscular por su ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await tursoClient.execute({
      sql: 'DELETE FROM routine_muscle_groups WHERE id = ?',
      args: [params.id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ message: 'Routine muscle group relationship not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Routine muscle group relationship deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting routine muscle group:', error);
    return NextResponse.json({ message: 'Error deleting routine muscle group', error }, { status: 500 });
  }
}