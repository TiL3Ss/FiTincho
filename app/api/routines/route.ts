// app/api/routines/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createClient } from '@libsql/client';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const weekNumber = searchParams.get('weekNumber');
    const dayName = searchParams.get('dayName');

    // Obtener el usuario actual de la sesión
    const currentUserResult = await tursoClient.execute({
      sql: 'SELECT id, username, is_moderator FROM users WHERE email = ?',
      args: [session.user.email]
    });

    const currentUser = currentUserResult.rows[0];

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Determinar qué usuario consultar
    let targetUserId = currentUser.id;
    if (userId && currentUser.is_moderator === 1) {
      // Solo los moderadores pueden consultar rutinas de otros usuarios
      targetUserId = parseInt(userId);
    }

    // Construir la consulta base
    let query = `
        SELECT 
          r.id as routine_id,
          r.week_number,
          r.day_name,
          mg.id as muscle_group_id,
          mg.name as muscle_group_name,
          e.id as exercise_id,
          e.name as exercise_name,
          e.variant as exercise_variant,
          re.id as routine_exercise_id,
          re.series,
          re.weight,
          re.reps,
          re.rest_time,
          re.progress,
          re.notes
        FROM routines r
        LEFT JOIN routine_muscle_groups rmg ON r.id = rmg.routine_id
        LEFT JOIN muscle_groups mg ON rmg.muscle_group_id = mg.id
        LEFT JOIN routine_exercises re ON r.id = re.routine_id AND mg.id = re.muscle_group_id
        LEFT JOIN exercises e ON re.exercise_id = e.id
        WHERE r.user_id = ? AND (r.is_active IS NULL OR r.is_active = 1)
      `;

    const params = [targetUserId];

    // Filtros opcionales
    if (weekNumber) {
      query += ' AND r.week_number = ?';
      params.push(parseInt(weekNumber));
    }
    if (dayName) {
      query += ' AND r.day_name = ?';
      params.push(dayName);
    }

    query += ' ORDER BY r.week_number, r.day_name, mg.id, re.series';

    const result = await tursoClient.execute({
      sql: query,
      args: params
    });

    const results = result.rows;

    // Estructurar los datos
    const weeks: any[] = [];
    const weeksMap = new Map();

    // Si no hay resultados, crear estructura vacía
    if (results.length === 0) {
      return NextResponse.json({
        weeks: [],
        canEdit: currentUser.is_moderator === 1 || targetUserId === currentUser.id
      });
    }

    results.forEach((row: any) => {
      const weekKey = row.week_number;
      
      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, {
          weekNumber: row.week_number,
          routines: []
        });
      }

      const week = weeksMap.get(weekKey);
      let routine = week.routines.find((r: any) => r.day === row.day_name);
      
      if (!routine) {
        routine = {
          day: row.day_name,
          muscleGroups: []
        };
        week.routines.push(routine);
      }

      if (row.muscle_group_id) {
        let muscleGroup = routine.muscleGroups.find((mg: any) => mg.id === `mg${row.muscle_group_id}`);
        
        if (!muscleGroup) {
          muscleGroup = {
            id: `mg${row.muscle_group_id}`,
            name: row.muscle_group_name,
            exercises: []
          };
          routine.muscleGroups.push(muscleGroup);
        }

        if (row.exercise_id) {
          let exercise = muscleGroup.exercises.find((ex: any) => ex.id === `ex${row.exercise_id}`);
          
          if (!exercise) {
            exercise = {
              id: `ex${row.exercise_id}`,
              name: row.exercise_name,
              variant: row.exercise_variant || '',
              data: []
            };
            muscleGroup.exercises.push(exercise);
          }

          if (row.routine_exercise_id) {
            exercise.data.push({
              id: row.routine_exercise_id,
              series: row.series || 1,
              weight: row.weight || 0,
              reps: row.reps || '',
              rest: row.rest_time || '',
              progress: row.progress || '',
              notes: row.notes || ''
            });
          }
        }
      }
    });

    // Convertir el Map a array y ordenar
    weeksMap.forEach((week) => {
      weeks.push(week);
    });

    return NextResponse.json({
      weeks: weeks.sort((a, b) => a.weekNumber - b.weekNumber),
      canEdit: currentUser.is_moderator === 1 || targetUserId === currentUser.id
    });

  } catch (error) {
    console.error('Error al obtener rutinas:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}