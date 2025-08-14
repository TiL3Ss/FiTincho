// /api/admin/routine-exercises/route.ts

import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// GET /api/admin/routine-exercises
// Obtiene todos los ejercicios de rutina con información detallada
export async function GET() {
  try {
    const routineExercisesResult = await tursoClient.execute({
      sql: `SELECT 
              re.id,
              re.routine_id,
              re.muscle_group_id,
              re.exercise_id,
              re.series,
              re.weight,
              re.reps,
              re.rest_time,
              re.progress,
              re.notes,
              re.created_at,
              u.first_name || ' ' || u.last_name || ' - Semana ' || r.week_number || ' - ' || r.day_name AS routine_info,
              mg.name AS muscle_group_name,
              e.name AS exercise_name
            FROM routine_exercises AS re
            JOIN routines AS r ON re.routine_id = r.id
            JOIN users AS u ON r.user_id = u.id
            JOIN muscle_groups AS mg ON re.muscle_group_id = mg.id
            JOIN exercises AS e ON re.exercise_id = e.id`,
      args: []
    });

    const routineExercises = routineExercisesResult.rows;

    return NextResponse.json(routineExercises);
  } catch (error) {
    console.error('Error fetching routine exercises:', error);
    return NextResponse.json({ message: 'Error fetching routine exercises', error }, { status: 500 });
  }
}

// POST /api/admin/routine-exercises
// Crea un nuevo ejercicio de rutina
export async function POST(request: Request) {
  try {
    const { routineId, muscleGroupId, exerciseId, series, weight, reps, restTime, progress, notes } = await request.json();

    if (!routineId || !muscleGroupId || !exerciseId || series == null || weight == null || reps == null) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const result = await tursoClient.execute({
      sql: 'INSERT INTO routine_exercises (routine_id, muscle_group_id, exercise_id, series, weight, reps, rest_time, progress, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [routineId, muscleGroupId, exerciseId, series, weight, reps, restTime, progress, notes]
    });

    const newRoutineExerciseResult = await tursoClient.execute({
      sql: 'SELECT * FROM routine_exercises WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    const newRoutineExercise = newRoutineExerciseResult.rows[0];

    return NextResponse.json(newRoutineExercise, { status: 201 });
  } catch (error) {
    console.error('Error creating routine exercise:', error);
    return NextResponse.json({ message: 'Error creating routine exercise', error }, { status: 500 });
  }
}