// /api/admin/exercises/route.ts

import { getDb } from '../../../lib/db_ticho';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener todos los ejercicios con información del grupo muscular
export async function GET() {
  try {
    const db = await getDb();
    
    // Query con JOIN para obtener el nombre del grupo muscular
    const exercises = await db.all(`
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
      ORDER BY mg.name ASC, e.name ASC
    `);
    
    // Verificar que hay datos para devolver
    if (!exercises) {
      return NextResponse.json([], { status: 200 });
    }
    
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

    const db = await getDb();

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

    // Verificar si ya existe un ejercicio con el mismo nombre y variante
    const existingExercise = await db.get(
      'SELECT id FROM exercises WHERE LOWER(name) = LOWER(?) AND COALESCE(LOWER(variant), "") = COALESCE(LOWER(?), "")',
      [name.trim(), variant?.trim() || null]
    );

    if (existingExercise) {
      return NextResponse.json(
        { message: 'Ya existe un ejercicio con ese nombre y variante' },
        { status: 409 }
      );
    }

    // Insertar el nuevo ejercicio
    const result = await db.run(
      `INSERT INTO exercises (name, variant, muscle_group_id, created_at, updated_at) 
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      [
        name.trim(),
        variant?.trim() || null,
        muscle_group_id || null
      ]
    );

    if (!result.lastID) {
      throw new Error('No se pudo crear el ejercicio');
    }

    // Obtener el ejercicio creado con información del grupo muscular
    const newExercise = await db.get(`
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
    `, [result.lastID]);

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