// /api/admin/routine-exercises/[id]/route.ts
import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Obtiene un ejercicio de rutina por su ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const routineExerciseResult = await tursoClient.execute({
      sql: 'SELECT * FROM routine_exercises WHERE id = ?',
      args: [params.id]
    });

    const routineExercise = routineExerciseResult.rows[0];

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
    const { routineId, exerciseId, sets, reps, notes } = await request.json();

    const result = await tursoClient.execute({
      sql: 'UPDATE routine_exercises SET routine_id = ?, exercise_id = ?, sets = ?, reps = ?, notes = ? WHERE id = ?',
      args: [routineId, exerciseId, sets, reps, notes, params.id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ message: 'Routine exercise not found or no changes made' }, { status: 404 });
    }

    const updatedRoutineExerciseResult = await tursoClient.execute({
      sql: 'SELECT * FROM routine_exercises WHERE id = ?',
      args: [params.id]
    });

    const updatedRoutineExercise = updatedRoutineExerciseResult.rows[0];

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
    const result = await tursoClient.execute({
      sql: 'DELETE FROM routine_exercises WHERE id = ?',
      args: [params.id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ message: 'Routine exercise not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Routine exercise deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting routine exercise:', error);
    return NextResponse.json({ message: 'Error deleting routine exercise', error }, { status: 500 });
  }
}