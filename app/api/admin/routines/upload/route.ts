// api/admin/routines/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

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
    const userExistsResult = await tursoClient.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [userId]
    });

    if (userExistsResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' }, 
        { status: 404 }
      );
    }

    try {
      const createdRoutines = [];
      let deactivatedRoutines = [];

      // 🗑️ PASO 1: Eliminar rutinas existentes para esta semana y usuario
      const existingRoutinesResult = await tursoClient.execute({
        sql: 'SELECT id, day_name FROM routines WHERE user_id = ? AND week_number = ?',
        args: [userId, routine.weekNumber]
      });

      if (existingRoutinesResult.rows.length > 0) {
        // Eliminar ejercicios de rutina relacionados primero (para evitar problemas de FK)
        for (const existingRoutine of existingRoutinesResult.rows) {
          await tursoClient.execute({
            sql: 'DELETE FROM routine_exercises WHERE routine_id = ?',
            args: [existingRoutine.id]
          });
          await tursoClient.execute({
            sql: 'DELETE FROM routine_muscle_groups WHERE routine_id = ?',
            args: [existingRoutine.id]
          });
        }

        // Eliminar las rutinas
        await tursoClient.execute({
          sql: 'DELETE FROM routines WHERE user_id = ? AND week_number = ?',
          args: [userId, routine.weekNumber]
        });

        deactivatedRoutines = existingRoutinesResult.rows.map(r => ({
          id: r.id,
          day: r.day_name
        }));

        console.log(`🗑️ Eliminadas ${existingRoutinesResult.rows.length} rutinas existentes para usuario ${userId}, semana ${routine.weekNumber}`);
      }

      // 🆕 PASO 2: Crear las nuevas rutinas (todas activas)
      for (const day of routine.days) {
        // Crear la rutina para este día
        const routineResult = await tursoClient.execute({
          sql: `
            INSERT INTO routines (
              user_id, week_number, day_name, is_active, 
              created_at, updated_at
            ) VALUES (?, ?, ?, 1, datetime("now", "localtime"), datetime("now", "localtime"))
          `,
          args: [userId, day.weekNumber, day.day]
        });

        const routineId = routineResult.lastInsertRowid;
        const muscleGroupIds = new Set<number>();

        // Procesar cada grupo muscular del día
        for (const muscleGroup of day.muscleGroups) {
          // Obtener o crear el grupo muscular
          const muscleGroupResult = await tursoClient.execute({
            sql: 'SELECT id FROM muscle_groups WHERE name = ?',
            args: [muscleGroup.name]
          });

          let muscleGroupId;
          if (muscleGroupResult.rows.length === 0) {
            const mgResult = await tursoClient.execute({
              sql: 'INSERT INTO muscle_groups (name, created_at) VALUES (?, datetime("now", "localtime"))',
              args: [muscleGroup.name]
            });
            muscleGroupId = mgResult.lastInsertRowid;
          } else {
            muscleGroupId = muscleGroupResult.rows[0].id;
          }

          muscleGroupIds.add(muscleGroupId);

          // Procesar cada ejercicio del grupo muscular
          for (const exercise of muscleGroup.exercises) {
            // Obtener o crear el ejercicio
            const exerciseResult = await tursoClient.execute({
              sql: 'SELECT id FROM exercises WHERE name = ? AND variant = ?',
              args: [exercise.name, exercise.variant || '']
            });

            let exerciseId;
            if (exerciseResult.rows.length === 0) {
              const exerciseCreateResult = await tursoClient.execute({
                sql: `
                  INSERT INTO exercises (
                    name, variant, muscle_group_id, created_at
                  ) VALUES (?, ?, ?, datetime("now", "localtime"))
                `,
                args: [exercise.name, exercise.variant || '', muscleGroupId]
              });
              exerciseId = exerciseCreateResult.lastInsertRowid;
            } else {
              exerciseId = exerciseResult.rows[0].id;
            }

            // Insertar cada serie del ejercicio
            for (let serieIndex = 0; serieIndex < exercise.data.length; serieIndex++) {
              const serie = exercise.data[serieIndex];
              
              await tursoClient.execute({
                sql: `
                  INSERT INTO routine_exercises (
                    routine_id, muscle_group_id, exercise_id, series,
                    weight, reps, rest_time, progress, notes
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                args: [
                  routineId,
                  muscleGroupId,
                  exerciseId,
                  serie.series,
                  serie.weight,
                  serie.reps,
                  `${serie.rest}s`,
                  serie.progress,
                  '' // notes vacías por defecto
                ]
              });
            }
          }
        }

        // Insertar relaciones rutina-grupo muscular
        for (const mgId of muscleGroupIds) {
          await tursoClient.execute({
            sql: 'INSERT OR IGNORE INTO routine_muscle_groups (routine_id, muscle_group_id) VALUES (?, ?)',
            args: [routineId, mgId]
          });
        }

        createdRoutines.push({
          id: routineId,
          day: day.day,
          week_number: day.weekNumber
        });
      }

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
      console.error('Error in upload transaction:', innerError);
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
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido como parámetro de consulta' },
        { status: 400 }
      );
    }

    // Obtener estadísticas de rutinas del usuario
    const statsResult = await tursoClient.execute({
      sql: `
        SELECT 
          week_number,
          day_name,
          COUNT(*) as routine_count,
          MAX(created_at) as last_upload
        FROM routines
        WHERE user_id = ?
        GROUP BY week_number, day_name
        ORDER BY week_number, day_name
      `,
      args: [userId]
    });

    const totalRoutinesResult = await tursoClient.execute({
      sql: 'SELECT COUNT(*) as total FROM routines WHERE user_id = ?',
      args: [userId]
    });

    return NextResponse.json({
      user_id: userId,
      total_routines: totalRoutinesResult.rows[0].total,
      routines_by_week_and_day: statsResult.rows
    });

  } catch (error) {
    console.error('Error getting routine stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de rutinas' },
      { status: 500 }
    );
  }
}