// app/api/admin/routines/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

// Configuración de la base de datos Turso
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// GET - Obtener todas las rutinas
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Obteniendo rutinas...');
    
    // Query para obtener rutinas con información básica
    const query = `
      SELECT 
        r.*,
        COUNT(re.id) as exercise_count
      FROM routines r
      LEFT JOIN routine_exercises re ON r.id = re.routine_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `;
    
    const result = await db.execute(query);
    console.log('✅ Rutinas obtenidas:', result.rows.length);
    
    // Formatear los datos para el frontend
    const routines = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      difficulty_level: row.difficulty_level,
      estimated_duration: row.estimated_duration,
      is_public: row.is_public,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      exercise_count: row.exercise_count || 0
    }));

    return NextResponse.json({
      routines,
      total: routines.length,
      message: 'Rutinas obtenidas correctamente'
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo rutinas:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        message: error.message,
        routines: [] // Fallback para evitar errores en el frontend
      },
      { status: 500 }
    );
  }
}

// POST - Crear nueva rutina
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creando rutina:', body);

    // Validaciones
    const { name, description, difficulty_level, estimated_duration, is_public } = body;
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la rutina es requerido' },
        { status: 400 }
      );
    }

    if (!difficulty_level || !['beginner', 'intermediate', 'advanced'].includes(difficulty_level)) {
      return NextResponse.json(
        { error: 'Nivel de dificultad inválido' },
        { status: 400 }
      );
    }

    if (!estimated_duration || estimated_duration <= 0) {
      return NextResponse.json(
        { error: 'La duración estimada debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una rutina con el mismo nombre
    const existingRoutine = await db.execute({
      sql: 'SELECT id FROM routines WHERE name = ? AND created_by = ?',
      args: [name.trim(), 1] // Asumiendo usuario admin con ID 1
    });

    if (existingRoutine.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una rutina con ese nombre' },
        { status: 400 }
      );
    }

    // Crear la rutina
    const insertResult = await db.execute({
      sql: `INSERT INTO routines 
            (name, description, difficulty_level, estimated_duration, is_public, created_by, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        name.trim(),
        description?.trim() || null,
        difficulty_level,
        estimated_duration,
        is_public ? 1 : 0,
        1 // created_by - ajusta según tu sistema de autenticación
      ]
    });

    console.log('✅ Rutina creada con ID:', insertResult.lastInsertRowid);

    return NextResponse.json({
      id: insertResult.lastInsertRowid,
      message: 'Rutina creada correctamente'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error creando rutina:', error);
    
    // Manejo específico de errores de base de datos
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Ya existe una rutina con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// app/api/admin/routines/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// GET - Obtener rutina específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routineId = parseInt(params.id);
    
    if (isNaN(routineId)) {
      return NextResponse.json(
        { error: 'ID de rutina inválido' },
        { status: 400 }
      );
    }

    console.log('🔍 Obteniendo rutina ID:', routineId);

    const result = await db.execute({
      sql: 'SELECT * FROM routines WHERE id = ?',
      args: [routineId]
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      );
    }

    const routine = result.rows[0];
    
    return NextResponse.json({
      routine: {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        difficulty_level: routine.difficulty_level,
        estimated_duration: routine.estimated_duration,
        is_public: routine.is_public,
        created_by: routine.created_by,
        created_at: routine.created_at,
        updated_at: routine.updated_at
      },
      message: 'Rutina obtenida correctamente'
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo rutina:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar rutina
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routineId = parseInt(params.id);
    const body = await request.json();
    
    if (isNaN(routineId)) {
      return NextResponse.json(
        { error: 'ID de rutina inválido' },
        { status: 400 }
      );
    }

    console.log('📝 Actualizando rutina ID:', routineId, body);

    // Validaciones
    const { name, description, difficulty_level, estimated_duration, is_public } = body;
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la rutina es requerido' },
        { status: 400 }
      );
    }

    if (!difficulty_level || !['beginner', 'intermediate', 'advanced'].includes(difficulty_level)) {
      return NextResponse.json(
        { error: 'Nivel de dificultad inválido' },
        { status: 400 }
      );
    }

    if (!estimated_duration || estimated_duration <= 0) {
      return NextResponse.json(
        { error: 'La duración estimada debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Verificar que la rutina existe
    const existingRoutine = await db.execute({
      sql: 'SELECT id FROM routines WHERE id = ?',
      args: [routineId]
    });

    if (existingRoutine.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      );
    }

    // Verificar duplicados de nombre (excluyendo la rutina actual)
    const duplicateCheck = await db.execute({
      sql: 'SELECT id FROM routines WHERE name = ? AND id != ?',
      args: [name.trim(), routineId]
    });

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe otra rutina con ese nombre' },
        { status: 400 }
      );
    }

    // Actualizar la rutina
    await db.execute({
      sql: `UPDATE routines 
            SET name = ?, description = ?, difficulty_level = ?, 
                estimated_duration = ?, is_public = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        name.trim(),
        description?.trim() || null,
        difficulty_level,
        estimated_duration,
        is_public ? 1 : 0,
        routineId
      ]
    });

    console.log('✅ Rutina actualizada:', routineId);

    return NextResponse.json({
      message: 'Rutina actualizada correctamente'
    });

  } catch (error: any) {
    console.error('❌ Error actualizando rutina:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Ya existe una rutina con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar rutina
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routineId = parseInt(params.id);
    
    if (isNaN(routineId)) {
      return NextResponse.json(
        { error: 'ID de rutina inválido' },
        { status: 400 }
      );
    }

    console.log('🗑️ Eliminando rutina ID:', routineId);

    // Verificar que la rutina existe
    const existingRoutine = await db.execute({
      sql: 'SELECT id FROM routines WHERE id = ?',
      args: [routineId]
    });

    if (existingRoutine.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar ejercicios asociados a la rutina (si existen)
    await db.execute({
      sql: 'DELETE FROM routine_exercises WHERE routine_id = ?',
      args: [routineId]
    });

    // Eliminar la rutina
    const deleteResult = await db.execute({
      sql: 'DELETE FROM routines WHERE id = ?',
      args: [routineId]
    });

    if (deleteResult.rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No se pudo eliminar la rutina' },
        { status: 400 }
      );
    }

    console.log('✅ Rutina eliminada:', routineId);

    return NextResponse.json({
      message: 'Rutina eliminada correctamente'
    });

  } catch (error: any) {
    console.error('❌ Error eliminando rutina:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// app/api/admin/routines/[id]/exercises/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// GET - Obtener ejercicios de una rutina específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routineId = parseInt(params.id);
    
    if (isNaN(routineId)) {
      return NextResponse.json(
        { error: 'ID de rutina inválido' },
        { status: 400 }
      );
    }

    console.log('🔍 Obteniendo ejercicios de rutina ID:', routineId);

    // Query para obtener ejercicios con información del ejercicio
    const query = `
      SELECT 
        re.*,
        e.name as exercise_name,
        e.muscle_group,
        e.equipment,
        e.description as exercise_description,
        e.image_url
      FROM routine_exercises re
      LEFT JOIN exercises e ON re.exercise_id = e.id
      WHERE re.routine_id = ?
      ORDER BY re.order_index ASC
    `;
    
    const result = await db.execute({
      sql: query,
      args: [routineId]
    });

    console.log('✅ Ejercicios de rutina obtenidos:', result.rows.length);

    // Formatear los datos
    const exercises = result.rows.map(row => ({
      id: row.id,
      routine_id: row.routine_id,
      exercise_id: row.exercise_id,
      sets: row.sets,
      reps: row.reps,
      weight: row.weight,
      rest_time: row.rest_time,
      notes: row.notes,
      order_index: row.order_index,
      exercise: row.exercise_name ? {
        id: row.exercise_id,
        name: row.exercise_name,
        muscle_group: row.muscle_group,
        equipment: row.equipment,
        description: row.exercise_description,
        image_url: row.image_url
      } : null
    }));

    return NextResponse.json({
      exercises,
      total: exercises.length,
      message: 'Ejercicios obtenidos correctamente'
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo ejercicios de rutina:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message,
        exercises: [] // Fallback para evitar errores en el frontend
      },
      { status: 500 }
    );
  }
}