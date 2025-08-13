
// /api/admin/routine-exercises/[id]/route.ts

import { getDb } from '../../../../lib/db_ticho';
import { NextResponse } from 'next/server';

// Obtiene un ejercicio de rutina por su ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const routineExercise = await db.get('SELECT * FROM routine_exercises WHERE id = ?', params.id);

    if (!routineExercise) {
      return NextResponse.json({ message: 'Routine exercise not found' }, { status: 404 });
    }

    return NextResponse.json(routineExercise);
  } catch (error) {
    console.error('Error fetching routine exercise:', error);
    return NextResponse.json({ message: 'Error fetching routine exercise', error }, { status: 500 });
  }
}

// PUT /api/admin/routine-exercises/[id]
// Actualiza un ejercicio de rutina por su ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const { routineId, exerciseId, sets, reps, notes } = await request.json();

    const result = await db.run(
      'UPDATE routine_exercises SET routine_id = ?, exercise_id = ?, sets = ?, reps = ?, notes = ? WHERE id = ?',
      [routineId, exerciseId, sets, reps, notes, params.id]
    );

    if (result.changes === 0) {
      return NextResponse.json({ message: 'Routine exercise not found or no changes made' }, { status: 404 });
    }

    const updatedRoutineExercise = await db.get('SELECT * FROM routine_exercises WHERE id = ?', params.id);

    return NextResponse.json(updatedRoutineExercise);
  } catch (error) {
    console.error('Error updating routine exercise:', error);
    return NextResponse.json({ message: 'Error updating routine exercise', error }, { status: 500 });
  }
}

// DELETE /api/admin/routine-exercises/[id]
// Elimina un ejercicio de rutina por su ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const result = await db.run('DELETE FROM routine_exercises WHERE id = ?', params.id);

    if (result.changes === 0) {
      return NextResponse.json({ message: 'Routine exercise not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Routine exercise deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting routine exercise:', error);
    return NextResponse.json({ message: 'Error deleting routine exercise', error }, { status: 500 });
  }
}