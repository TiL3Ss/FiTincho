// /api/admin/exercises/route.ts

import { createClient } from '@libsql/client';
import { NextRequest, NextResponse } from 'next/server';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// GET - Obtener todos los ejercicios con información del grupo muscular
export async function GET() {
  try {
    // Query con JOIN para obtener el nombre del grupo muscular
    const exercisesResult = await tursoClient.execute({
      sql: `SELECT 
              e.id,
              e.name,
              e.variant,
              e.muscle_group_id,
              mg.name as muscle_group_name,
              e.created_at,
              e.updated_at
            FROM exercises e
            LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
            ORDER BY mg.name ASC, e.name ASC`,
      args: []
    });
    
    const exercises = exercisesResult.rows;
    
    return NextResponse.json(exercises, { status: 200 });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { 
        message: 'Error al obtener ejercicios', 
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo ejercicio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, variant, muscle_group_id } = body;

    // Validaciones
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { message: 'El nombre del ejercicio es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el muscle_group_id existe si se proporciona
    if (muscle_group_id) {
      const muscleGroupResult = await tursoClient.execute({
        sql: 'SELECT id FROM muscle_groups WHERE id = ?',
        args: [muscle_group_id]
      });
      
      if (muscleGroupResult.rows.length === 0) {
        return NextResponse.json(
          { message: 'El grupo muscular especificado no existe' },
          { status: 400 }
        );
      }
    }

    // Verificar si ya existe un ejercicio con el mismo nombre y variante
    const existingExerciseResult = await tursoClient.execute({
      sql: 'SELECT id FROM exercises WHERE LOWER(name) = LOWER(?) AND COALESCE(LOWER(variant), "") = COALESCE(LOWER(?), "")',
      args: [name.trim(), variant?.trim() || null]
    });

    if (existingExerciseResult.rows.length > 0) {
      return NextResponse.json(
        { message: 'Ya existe un ejercicio con ese nombre y variante' },
        { status: 409 }
      );
    }

    // Insertar el nuevo ejercicio
    const result = await tursoClient.execute({
      sql: `INSERT INTO exercises (name, variant, muscle_group_id, created_at, updated_at) 
           VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        name.trim(),
        variant?.trim() || null,
        muscle_group_id || null
      ]
    });

    if (!result.lastInsertRowid) {
      throw new Error('No se pudo crear el ejercicio');
    }

    // Obtener el ejercicio creado con información del grupo muscular
    const newExerciseResult = await tursoClient.execute({
      sql: `SELECT 
              e.id,
              e.name,
              e.variant,
              e.muscle_group_id,
              mg.name as muscle_group_name,
              e.created_at,
              e.updated_at
            FROM exercises e
            LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
            WHERE e.id = ?`,
      args: [result.lastInsertRowid]
    });

    const newExercise = newExerciseResult.rows[0];

    return NextResponse.json(newExercise, { status: 201 });

  } catch (error) {
    console.error('Error creating exercise:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: 'Datos JSON inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Error al crear el ejercicio', 
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}