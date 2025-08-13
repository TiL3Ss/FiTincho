// api/admin/routines/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db_ticho';

// Función helper para obtener una rutina completa por ID
async function getCompleteRoutineById(db: any, routineId: number) {
  const routines = await db.all(`
    SELECT 
      r.id as routine_id,
      r.week_number,
      r.day_name,
      r.is_active,
      r.created_at,
      u.username,
      mg.name as muscle_group_name,
      mg.id as muscle_group_id,
      e.name as exercise_name,
      e.variant as exercise_variant,
      re.series,
      re.weight,
      re.reps,
      re.rest_time,
      re.progress,
      re.notes
    FROM routines r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN routine_exercises re ON r.id = re.routine_id
    LEFT JOIN exercises e ON re.exercise_id = e.id
    LEFT JOIN muscle_groups mg ON re.muscle_group_id = mg.id
    WHERE r.id = ?
    ORDER BY mg.name, e.name, re.series
  `, [routineId]);

  if (routines.length === 0) {
    return null;
  }

  const routine = {
    id: routines[0].routine_id,
    week_number: routines[0].week_number,
    day_name: routines[0].day_name,
    is_active: routines[0].is_active,
    created_at: routines[0].created_at,
    username: routines[0].username,
    muscle_groups: {},
    exercises: {}
  };

  routines.forEach(row => {
    if (row.muscle_group_id) {
      routine.muscle_groups[row.muscle_group_id] = {
        id: row.muscle_group_id,
        name: row.muscle_group_name
      };
    }

    if (row.exercise_name) {
      const exerciseKey = `${row.exercise_name}_${row.exercise_variant || ''}`;
      
      if (!routine.exercises[exerciseKey]) {
        routine.exercises[exerciseKey] = {
          name: row.exercise_name,
          variant: row.exercise_variant,
          muscle_group: row.muscle_group_name,
          series: []
        };
      }

      routine.exercises[exerciseKey].series.push({
        series: row.series,
        weight: row.weight,
        reps: row.reps,
        rest_time: row.rest_time,
        progress: row.progress,
        notes: row.notes
      });
    }
  });

  const muscleGroupFrequency = {};
  Object.values(routine.exercises).forEach(exercise => {
    const mgName = exercise.muscle_group;
    if (mgName) {
      muscleGroupFrequency[mgName] = (muscleGroupFrequency[mgName] || 0) + 1;
    }
  });

  return {
    ...routine,
    muscle_groups: Object.values(routine.muscle_groups),
    exercises: Object.values(routine.exercises),
    muscle_group_frequency: muscleGroupFrequency
  };
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = await getDb();
    // Await params before accessing its properties
    const { id } = await params;
    const routineId = parseInt(id);
    const body = await request.json();

    // Check if this is just an is_active update (from the backup component)
    if (body.hasOwnProperty('is_active') && Object.keys(body).length === 1) {
      // Simple status update
      await db.run(
        'UPDATE routines SET is_active = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
        [body.is_active, routineId]
      );

      return NextResponse.json({ 
        message: `Rutina ${body.is_active ? 'activada' : 'desactivada'} exitosamente`
      });
    }

    // Full routine update (original logic)
    const { week_number, day_name, exercises } = body;

    if (!week_number || !day_name || !exercises) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: week_number, day_name, exercises' }, 
        { status: 400 }
      );
    }

    await db.run('BEGIN TRANSACTION');

    try {
      await db.run(
        'UPDATE routines SET week_number = ?, day_name = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
        [week_number, day_name, routineId]
      );

      await db.run('DELETE FROM routine_exercises WHERE routine_id = ?', [routineId]);
      await db.run('DELETE FROM routine_muscle_groups WHERE routine_id = ?', [routineId]);

      const muscleGroupIds = new Set();
      
      for (const exercise of exercises) {
        muscleGroupIds.add(exercise.muscle_group_id);
        
        for (let serieIndex = 0; serieIndex < exercise.series.length; serieIndex++) {
          const serie = exercise.series[serieIndex];
          await db.run(`
            INSERT INTO routine_exercises (
              routine_id, muscle_group_id, exercise_id, series, 
              weight, reps, rest_time, progress, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            routineId,
            exercise.muscle_group_id,
            exercise.exercise_id,
            serieIndex + 1,
            serie.weight,
            serie.reps,
            serie.rest_time || '60s',
            serie.progress || 0,
            serie.notes || ''
          ]);
        }
      }

      for (const mgId of muscleGroupIds) {
        await db.run(
          'INSERT OR IGNORE INTO routine_muscle_groups (routine_id, muscle_group_id) VALUES (?, ?)',
          [routineId, mgId]
        );
      }

      await db.run('COMMIT');

      const completeRoutine = await getCompleteRoutineById(db, routineId);

      return NextResponse.json({ 
        message: 'Rutina actualizada exitosamente',
        routine: completeRoutine 
      });
    } catch (innerError) {
      await db.run('ROLLBACK');
      throw innerError;
    }
  } catch (error) {
    console.error('Error updating routine:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la rutina' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = await getDb();
    // Await params before accessing its properties
    const { id } = await params;
    const routineId = parseInt(id);

    if (!routineId) {
      return NextResponse.json(
        { error: 'ID de rutina requerido' }, 
        { status: 400 }
      );
    }

    await db.run('DELETE FROM routines WHERE id = ?', [routineId]);

    return NextResponse.json({ message: 'Rutina eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting routine:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la rutina' }, 
      { status: 500 }
    );
  }
}