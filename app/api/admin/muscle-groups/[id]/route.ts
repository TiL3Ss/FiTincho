// /api/admin/muscle-groups/[id]/route.ts

import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// GET /api/admin/muscle-groups/[id]
// Obtiene un grupo muscular específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID inválido' }, { status: 400 });
    }

    const muscleGroupResult = await tursoClient.execute({
      sql: 'SELECT * FROM muscle_groups WHERE id = ?',
      args: [id]
    });

    if (muscleGroupResult.rows.length === 0) {
      return NextResponse.json({ message: 'Grupo muscular no encontrado' }, { status: 404 });
    }

    return NextResponse.json(muscleGroupResult.rows[0]);
  } catch (error) {
    console.error('Error fetching muscle group:', error);
    return NextResponse.json({ message: 'Error al obtener el grupo muscular', error }, { status: 500 });
  }
}

// PUT /api/admin/muscle-groups/[id]
// Actualiza un grupo muscular
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const { name, color_gm } = await request.json();
    
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID inválido' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'El nombre del grupo muscular es requerido' }, { status: 400 });
    }

    // Verificar si el grupo existe
    const existingGroupResult = await tursoClient.execute({
      sql: 'SELECT * FROM muscle_groups WHERE id = ?',
      args: [id]
    });

    if (existingGroupResult.rows.length === 0) {
      return NextResponse.json({ message: 'Grupo muscular no encontrado' }, { status: 404 });
    }

    // Verificar si ya existe otro grupo con el mismo nombre (excluyendo el actual)
    const duplicateCheckResult = await tursoClient.execute({
      sql: 'SELECT id FROM muscle_groups WHERE LOWER(name) = LOWER(?) AND id != ?',
      args: [name.trim(), id]
    });

    if (duplicateCheckResult.rows.length > 0) {
      return NextResponse.json({ message: 'Ya existe otro grupo muscular con este nombre' }, { status: 400 });
    }

    // Actualizar el grupo muscular
    await tursoClient.execute({
      sql: 'UPDATE muscle_groups SET name = ?, color_gm = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [name.trim(), color_gm || 'ocean', id]
    });

    // Obtener el grupo actualizado
    const updatedGroupResult = await tursoClient.execute({
      sql: 'SELECT * FROM muscle_groups WHERE id = ?',
      args: [id]
    });

    return NextResponse.json(updatedGroupResult.rows[0]);
  } catch (error) {
    console.error('Error updating muscle group:', error);
    return NextResponse.json({ message: 'Error al actualizar el grupo muscular', error }, { status: 500 });
  }
}

// DELETE /api/admin/muscle-groups/[id]
// Elimina un grupo muscular
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID inválido' }, { status: 400 });
    }

    // Verificar si el grupo existe
    const existingGroupResult = await tursoClient.execute({
      sql: 'SELECT * FROM muscle_groups WHERE id = ?',
      args: [id]
    });

    if (existingGroupResult.rows.length === 0) {
      return NextResponse.json({ message: 'Grupo muscular no encontrado' }, { status: 404 });
    }

    // Verificar si hay ejercicios asignados a este grupo
    const exercisesWithGroupResult = await tursoClient.execute({
      sql: 'SELECT COUNT(*) as count FROM exercises WHERE muscle_group_id = ?',
      args: [id]
    });

    const exerciseCount = exercisesWithGroupResult.rows[0].count as number;

    if (exerciseCount > 0) {
      return NextResponse.json({ 
        message: `No se puede eliminar el grupo muscular porque tiene ${exerciseCount} ejercicio${exerciseCount > 1 ? 's' : ''} asignado${exerciseCount > 1 ? 's' : ''}` 
      }, { status: 400 });
    }

    // Eliminar el grupo muscular
    const deleteResult = await tursoClient.execute({
      sql: 'DELETE FROM muscle_groups WHERE id = ?',
      args: [id]
    });

    // Verificar que se eliminó correctamente
    if (deleteResult.rowsAffected === 0) {
      return NextResponse.json({ message: 'No se pudo eliminar el grupo muscular' }, { status: 500 });
    }

    console.log(`Grupo muscular con ID ${id} eliminado. Filas afectadas: ${deleteResult.rowsAffected}`);
    
    return NextResponse.json({ 
      message: 'Grupo muscular eliminado correctamente',
      deletedId: id,
      rowsAffected: deleteResult.rowsAffected
    });
  } catch (error) {
    console.error('Error deleting muscle group:', error);
    return NextResponse.json({ message: 'Error al eliminar el grupo muscular', error: error.message }, { status: 500 });
  }
}