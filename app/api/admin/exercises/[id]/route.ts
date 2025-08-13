// /api/admin/exercises/[id]/route.ts

import { getDb } from '../../../../lib/db_ticho';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT - Actualizar un ejercicio existente
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const exerciseId = parseInt(id);

    if (isNaN(exerciseId)) {
      return NextResponse.json(
        { message: 'ID de ejercicio inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, variant, muscle_group_id } = body;

    // Validaciones
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { message: 'El nombre del ejercicio es requerido' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Verificar que el ejercicio existe
    const existingExercise = await db.get(
      'SELECT id FROM exercises WHERE id = ?',
      [exerciseId]
    );

    if (!existingExercise) {
      return NextResponse.json(
        { message: 'Ejercicio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el muscle_group_id existe si se proporciona
    if (muscle_group_id) {
      const muscleGroupExists = await db.get(
        'SELECT id FROM muscle_groups WHERE id = ?',
        [muscle_group_id]
      );
      
      if (!muscleGroupExists) {
        return NextResponse.json(
          { message: 'El grupo muscular especificado no existe' },
          { status: 400 }
        );
      }
    }

    // Verificar si ya existe otro ejercicio con el mismo nombre y variante
    const duplicateExercise = await db.get(
      'SELECT id FROM exercises WHERE LOWER(name) = LOWER(?) AND COALESCE(LOWER(variant), "") = COALESCE(LOWER(?), "") AND id != ?',
      [name.trim(), variant?.trim() || null, exerciseId]
    );

    if (duplicateExercise) {
      return NextResponse.json(
        { message: 'Ya existe otro ejercicio con ese nombre y variante' },
        { status: 409 }
      );
    }

    // Actualizar el ejercicio
    await db.run(
      `UPDATE exercises 
       SET name = ?, variant = ?, muscle_group_id = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        name.trim(),
        variant?.trim() || null,
        muscle_group_id || null,
        exerciseId
      ]
    );

    // Obtener el ejercicio actualizado con información del grupo muscular
    const updatedExercise = await db.get(`
      SELECT 
        e.id,
        e.name,
        e.variant,
        e.muscle_group_id,
        mg.name as muscle_group_name,
        e.created_at,
        e.updated_at
      FROM exercises e
      LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
      WHERE e.id = ?
    `, [exerciseId]);

    return NextResponse.json(updatedExercise, { status: 200 });

  } catch (error) {
    console.error('Error updating exercise:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: 'Datos JSON inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Error al actualizar el ejercicio', 
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un ejercicio
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const exerciseId = parseInt(id);

    if (isNaN(exerciseId)) {
      return NextResponse.json(
        { message: 'ID de ejercicio inválido' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Verificar que el ejercicio existe
    const existingExercise = await db.get(
      'SELECT id, name FROM exercises WHERE id = ?',
      [exerciseId]
    );

    if (!existingExercise) {
      return NextResponse.json(
        { message: 'Ejercicio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el ejercicio está siendo usado en alguna rutina
    // (Opcional: Descomentar si tienes tablas de rutinas que referencien ejercicios)
    /*
    const exerciseInUse = await db.get(
      'SELECT id FROM routine_exercises WHERE exercise_id = ? LIMIT 1',
      [exerciseId]
    );

    if (exerciseInUse) {
      return NextResponse.json(
        { message: 'No se puede eliminar el ejercicio porque está siendo usado en una o más rutinas' },
        { status: 409 }
      );
    }
    */

    // Eliminar el ejercicio
    const result = await db.run('DELETE FROM exercises WHERE id = ?', [exerciseId]);

    if (result.changes === 0) {
      return NextResponse.json(
        { message: 'No se pudo eliminar el ejercicio' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Ejercicio eliminado correctamente',
        deleted_exercise: existingExercise 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { 
        message: 'Error al eliminar el ejercicio', 
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}