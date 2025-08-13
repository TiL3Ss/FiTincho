// api/admin/routines/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db_ticho';

interface ExerciseData {
  series: number;
  weight: number;
  reps: string;
  rest: number;
  progress: number;
}

interface ParsedExercise {
  name: string;
  variant: string;
  data: ExerciseData[];
}

interface ParsedMuscleGroup {
  name: string;
  exercises: ParsedExercise[];
}

interface ParsedRoutineDay {
  day: string;
  weekNumber: number;
  muscleGroups: ParsedMuscleGroup[];
}

interface ParsedRoutine {
  userName: string;
  weekNumber: number;
  days: ParsedRoutineDay[];
}

interface UploadRequest {
  userId: string;
  routine: ParsedRoutine;
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body: UploadRequest = await request.json();
    const { userId, routine } = body;

    // Validar datos de entrada
    if (!userId || !routine) {
      return NextResponse.json(
        { error: 'Usuario y rutina son requeridos' }, 
        { status: 400 }
      );
    }

    if (!routine.days || routine.days.length === 0) {
      return NextResponse.json(
        { error: 'La rutina debe tener al menos un día' }, 
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userExists = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userExists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' }, 
        { status: 404 }
      );
    }

    await db.run('BEGIN TRANSACTION');

    try {
      const createdRoutines = [];
      let deactivatedRoutines = [];

      // 🗑️ PASO 1: Eliminar rutinas existentes para esta semana y usuario
      const existingRoutines = await db.all(
        'SELECT id, day_name FROM routines WHERE user_id = ? AND week_number = ?',
        [userId, routine.weekNumber]
      );

      if (existingRoutines.length > 0) {
        // Eliminar ejercicios de rutina relacionados primero (para evitar problemas de FK)
        for (const existingRoutine of existingRoutines) {
          await db.run(
            'DELETE FROM routine_exercises WHERE routine_id = ?',
            [existingRoutine.id]
          );
          await db.run(
            'DELETE FROM routine_muscle_groups WHERE routine_id = ?',
            [existingRoutine.id]
          );
        }

        // Eliminar las rutinas
        await db.run(
          'DELETE FROM routines WHERE user_id = ? AND week_number = ?',
          [userId, routine.weekNumber]
        );

        deactivatedRoutines = existingRoutines.map(r => ({
          id: r.id,
          day: r.day_name
        }));

        console.log(`🗑️ Eliminadas ${existingRoutines.length} rutinas existentes para usuario ${userId}, semana ${routine.weekNumber}`);
      }

      // 🆕 PASO 2: Crear las nuevas rutinas (todas activas)
      for (const day of routine.days) {
        // Crear la rutina para este día
        const routineResult = await db.run(`
          INSERT INTO routines (
            user_id, week_number, day_name, is_active, 
            created_at, updated_at
          ) VALUES (?, ?, ?, 1, datetime("now", "localtime"), datetime("now", "localtime"))
        `, [userId, day.weekNumber, day.day]);

        const routineId = routineResult.lastID;
        const muscleGroupIds = new Set<number>();

        // Procesar cada grupo muscular del día
        for (const muscleGroup of day.muscleGroups) {
          // Obtener o crear el grupo muscular
          let muscleGroupRecord = await db.get(
            'SELECT id FROM muscle_groups WHERE name = ?', 
            [muscleGroup.name]
          );

          if (!muscleGroupRecord) {
            const mgResult = await db.run(
              'INSERT INTO muscle_groups (name, created_at) VALUES (?, datetime("now", "localtime"))',
              [muscleGroup.name]
            );
            muscleGroupRecord = { id: mgResult.lastID };
          }

          muscleGroupIds.add(muscleGroupRecord.id);

          // Procesar cada ejercicio del grupo muscular
          for (const exercise of muscleGroup.exercises) {
            // Obtener o crear el ejercicio
            let exerciseRecord = await db.get(
              'SELECT id FROM exercises WHERE name = ? AND variant = ?', 
              [exercise.name, exercise.variant || '']
            );

            if (!exerciseRecord) {
              const exerciseResult = await db.run(`
                INSERT INTO exercises (
                  name, variant, muscle_group_id, created_at
                ) VALUES (?, ?, ?, datetime("now", "localtime"))
              `, [exercise.name, exercise.variant || '', muscleGroupRecord.id]);
              
              exerciseRecord = { id: exerciseResult.lastID };
            }

            // Insertar cada serie del ejercicio
            for (let serieIndex = 0; serieIndex < exercise.data.length; serieIndex++) {
              const serie = exercise.data[serieIndex];
              
              await db.run(`
                INSERT INTO routine_exercises (
                  routine_id, muscle_group_id, exercise_id, series,
                  weight, reps, rest_time, progress, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                routineId,
                muscleGroupRecord.id,
                exerciseRecord.id,
                serie.series,
                serie.weight,
                serie.reps,
                `${serie.rest}s`,
                serie.progress,
                '' // notes vacías por defecto
              ]);
            }
          }
        }

        // Insertar relaciones rutina-grupo muscular
        for (const mgId of muscleGroupIds) {
          await db.run(
            'INSERT OR IGNORE INTO routine_muscle_groups (routine_id, muscle_group_id) VALUES (?, ?)',
            [routineId, mgId]
          );
        }

        createdRoutines.push({
          id: routineId,
          day: day.day,
          week_number: day.weekNumber
        });
      }

      await db.run('COMMIT');

      // 📊 Preparar respuesta con información completa
      const responseMessage = deactivatedRoutines.length > 0 
        ? `Rutina actualizada exitosamente. Se eliminaron ${deactivatedRoutines.length} rutinas anteriores y se crearon ${createdRoutines.length} nuevas rutinas.`
        : 'Rutina cargada exitosamente';

      return NextResponse.json({
        message: responseMessage,
        routines: createdRoutines,
        deactivatedRoutines,
        summary: {
          user_id: userId,
          week_number: routine.weekNumber,
          days_created: routine.days.length,
          total_routines_created: createdRoutines.length,
          total_routines_replaced: deactivatedRoutines.length,
          operation_type: deactivatedRoutines.length > 0 ? 'replace' : 'create'
        }
      });

    } catch (innerError) {
      await db.run('ROLLBACK');
      throw innerError;
    }

  } catch (error) {
    console.error('Error uploading routine:', error);
    
    // Determinar el tipo de error y devolver respuesta apropiada
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { error: 'Error de duplicación de datos' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return NextResponse.json(
          { error: 'Error de referencia en la base de datos' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al cargar la rutina' },
      { status: 500 }
    );
  }
}

// Función helper para obtener estadísticas de rutinas cargadas (opcional)
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido como parámetro de consulta' },
        { status: 400 }
      );
    }

    // Obtener estadísticas de rutinas del usuario
    const stats = await db.all(`
      SELECT 
        week_number,
        day_name,
        COUNT(*) as routine_count,
        MAX(created_at) as last_upload
      FROM routines
      WHERE user_id = ?
      GROUP BY week_number, day_name
      ORDER BY week_number, day_name
    `, [userId]);

    const totalRoutines = await db.get(
      'SELECT COUNT(*) as total FROM routines WHERE user_id = ?',
      [userId]
    );

    return NextResponse.json({
      user_id: userId,
      total_routines: totalRoutines.total,
      routines_by_week_and_day: stats
    });

  } catch (error) {
    console.error('Error getting routine stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de rutinas' },
      { status: 500 }
    );
  }
}