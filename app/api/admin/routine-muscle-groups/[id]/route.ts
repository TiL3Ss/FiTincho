// /api/admin/routine-muscle-groups/[id].route.ts

import { getDb } from '../../../../lib/db_ticho';
import { NextResponse } from 'next/server';

// Actualiza una relación de rutina-grupo muscular por su ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const { routine_id, muscle_group_id } = await request.json();

    if (!routine_id || !muscle_group_id) {
      return NextResponse.json({ message: 'Missing required fields: routine_id and muscle_group_id' }, { status: 400 });
    }

    // Verificar si la nueva relación ya existe para evitar duplicados, excluyendo el ID actual
    const existingRelation = await db.get(
      'SELECT id FROM routine_muscle_groups WHERE routine_id = ? AND muscle_group_id = ? AND id != ?',
      [routine_id, muscle_group_id, params.id]
    );

    if (existingRelation) {
      return NextResponse.json({ message: 'This routine-muscle group relationship already exists' }, { status: 409 });
    }

    const result = await db.run(
      'UPDATE routine_muscle_groups SET routine_id = ?, muscle_group_id = ? WHERE id = ?',
      [routine_id, muscle_group_id, params.id]
    );

    if (result.changes === 0) {
      return NextResponse.json({ message: 'Routine muscle group relationship not found or no changes made' }, { status: 404 });
    }

    const updatedRoutineMuscleGroup = await db.get(
      'SELECT * FROM routine_muscle_groups WHERE id = ?',
      params.id
    );

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
    const db = await getDb();
    const result = await db.run('DELETE FROM routine_muscle_groups WHERE id = ?', params.id);

    if (result.changes === 0) {
      return NextResponse.json({ message: 'Routine muscle group relationship not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Routine muscle group relationship deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting routine muscle group:', error);
    return NextResponse.json({ message: 'Error deleting routine muscle group', error }, { status: 500 });
  }
}