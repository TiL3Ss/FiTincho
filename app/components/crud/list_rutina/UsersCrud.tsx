// components/crud/RoutinesCrud.tsx
'use client';

import { useState, useEffect } from 'react';
import { TrashIcon, PencilSquareIcon, ArrowLeftIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment?: string;
  description?: string;
  image_url?: string;
}

interface RoutineExercise {
  id: number;
  routine_id: number;
  exercise_id: number;
  sets: number;
  reps: string;
  weight?: string;
  rest_time?: number;
  notes?: string;
  order_index: number;
  exercise?: Exercise;
}

interface Routine {
  id: number;
  name: string;
  description?: string;
  difficulty_level: string;
  estimated_duration: number;
  is_public: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  exercises?: RoutineExercise[];
}

interface RoutineFormData {
  name: string;
  description: string;
  difficulty_level: string;
  estimated_duration: number;
  is_public: boolean;
}

interface RoutinesCrudProps {
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onClose: () => void;
}

const initialFormData: RoutineFormData = {
  name: '',
  description: '',
  difficulty_level: 'beginner',
  estimated_duration: 30,
  is_public: false
};

export default function RoutinesCrud({ showNotification, onClose }: RoutinesCrudProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [formData, setFormData] = useState<RoutineFormData>(initialFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [viewingRoutine, setViewingRoutine] = useState<Routine | null>(null);

  // Cargar rutinas
  const fetchRoutines = async () => {
    try {
      setTableLoading(true);
      const response = await fetch('/api/admin/routines');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar rutinas');
      }
      
      const data = await response.json();
      console.log('Datos recibidos de la API:', data);
      
      // ✅ FIXED: Manejar el nuevo formato de respuesta de Turso API
      if (data.routines && Array.isArray(data.routines)) {
        // Nuevo formato con paginación
        setRoutines(data.routines);
      } else if (Array.isArray(data)) {
        // Formato anterior (fallback)
        setRoutines(data);
      } else {
        throw new Error('Formato de datos inesperado');
      }
    } catch (error: any) {
      console.error('Error cargando rutinas:', error);
      showNotification(error.message || 'Error al cargar rutinas', 'error');
      setRoutines([]); // Asegurar que routines sea un array
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'estimated_duration' ? parseInt(value) || 0 : 
              value
    }));
  };

  // Validar formulario
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showNotification('El nombre de la rutina es requerido', 'warning');
      return false;
    }
    
    if (formData.estimated_duration <= 0) {
      showNotification('La duración estimada debe ser mayor a 0', 'warning');
      return false;
    }
    
    return true;
  };

  // Crear o actualizar rutina
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const url = editingId 
        ? `/api/admin/routines/${editingId}` 
        : '/api/admin/routines';
      
      const method = editingId ? 'PUT' : 'POST';

      console.log('Enviando datos:', { url, method, data: formData });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Error al guardar rutina');
      }

      showNotification(
        responseData.message || (editingId ? 'Rutina actualizada correctamente' : 'Rutina creada correctamente'),
        'success'
      );
      
      setFormData(initialFormData);
      setEditingId(null);
      fetchRoutines();
    } catch (error: any) {
      console.error('Error guardando rutina:', error);
      showNotification(error.message || 'Error al guardar rutina', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar rutina
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta rutina?')) return;

    try {
      console.log('Eliminando rutina:', id);
      const response = await fetch(`/api/admin/routines/${id}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();
      console.log('Respuesta delete:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Error al eliminar rutina');
      }

      showNotification('Rutina eliminada correctamente', 'success');
      fetchRoutines();
    } catch (error: any) {
      console.error('Error eliminando rutina:', error);
      showNotification(error.message || 'Error al eliminar rutina', 'error');
    }
  };

  // Editar rutina
  const handleEdit = (routine: Routine) => {
    console.log('Editando rutina:', routine);
    setFormData({
      name: routine.name,
      description: routine.description || '',
      difficulty_level: routine.difficulty_level,
      estimated_duration: routine.estimated_duration,
      is_public: Boolean(routine.is_public)
    });
    setEditingId(routine.id);
  };

  // Ver detalles de rutina
  const handleView = async (routine: Routine) => {
    try {
      // Cargar ejercicios de la rutina
      const response = await fetch(`/api/admin/routines/${routine.id}/exercises`);
      if (response.ok) {
        const exercisesData = await response.json();
        console.log('Ejercicios de la rutina:', exercisesData);
        
        // ✅ FIXED: Manejar el nuevo formato de respuesta de Turso API
        let exercises = [];
        if (exercisesData.exercises && Array.isArray(exercisesData.exercises)) {
          exercises = exercisesData.exercises;
        } else if (Array.isArray(exercisesData)) {
          exercises = exercisesData;
        }
        
        setViewingRoutine({ ...routine, exercises });
      } else {
        setViewingRoutine({ ...routine, exercises: [] });
      }
    } catch (error) {
      console.error('Error cargando ejercicios:', error);
      setViewingRoutine({ ...routine, exercises: [] });
    }
  };

  // Cancelar edición
  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  // Formatear duración
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Obtener color por dificultad
  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Modal de detalles
  if (viewingRoutine) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewingRoutine(null)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{viewingRoutine.name}</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{formatDuration(viewingRoutine.estimated_duration)}</div>
              <div className="text-sm text-gray-600">Duración</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(viewingRoutine.difficulty_level)}`}>
                {viewingRoutine.difficulty_level === 'beginner' ? 'Principiante' :
                 viewingRoutine.difficulty_level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Dificultad</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{viewingRoutine.exercises?.length || 0}</div>
              <div className="text-sm text-gray-600">Ejercicios</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-sm font-semibold ${viewingRoutine.is_public ? 'text-green-600' : 'text-gray-600'}`}>
                {viewingRoutine.is_public ? 'Pública' : 'Privada'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Visibilidad</div>
            </div>
          </div>

          {viewingRoutine.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h3>
              <p className="text-gray-600">{viewingRoutine.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ejercicios</h3>
            {viewingRoutine.exercises && viewingRoutine.exercises.length > 0 ? (
              <div className="space-y-3">
                {viewingRoutine.exercises.map((routineExercise) => (
                  <div key={routineExercise.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">
                          {routineExercise.exercise?.name || `Ejercicio ID: ${routineExercise.exercise_id}`}
                        </h4>
                        {routineExercise.exercise?.muscle_group && (
                          <p className="text-sm text-gray-600 mb-2">{routineExercise.exercise.muscle_group}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span><strong>Series:</strong> {routineExercise.sets}</span>
                          <span><strong>Repeticiones:</strong> {routineExercise.reps}</span>
                          {routineExercise.weight && <span><strong>Peso:</strong> {routineExercise.weight}</span>}
                          {routineExercise.rest_time && <span><strong>Descanso:</strong> {routineExercise.rest_time}s</span>}
                        </div>
                        {routineExercise.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">{routineExercise.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay ejercicios en esta rutina</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 text-gray-600">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Volver al menú principal"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:transform group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Rutinas</h2>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Tabla de rutinas */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Lista de Rutinas ({routines.length} total)
              </h3>
            </div>
            
            <div className="flex-1 overflow-auto">
              {tableLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : routines.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">No hay rutinas</p>
                    <p className="text-sm">Crea la primera rutina usando el formulario de la derecha</p>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rutina
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dificultad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {routines.map((routine) => (
                      <tr key={routine.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {routine.name}
                            </div>
                            {routine.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {routine.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(routine.difficulty_level)}`}>
                            {routine.difficulty_level === 'beginner' ? 'Principiante' :
                             routine.difficulty_level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(routine.estimated_duration)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            routine.is_public 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {routine.is_public ? 'Pública' : 'Privada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleView(routine)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(routine)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="Editar rutina"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(routine.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Eliminar rutina"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="w-96 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingId ? 'Editar Rutina' : 'Nueva Rutina'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nombre de la rutina"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Descripción de la rutina"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dificultad *
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración estimada (minutos) *
                </label>
                <input
                  type="number"
                  name="estimated_duration"
                  value={formData.estimated_duration}
                  onChange={handleInputChange}
                  min="5"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="30"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Rutina pública</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Guardando...
                    </span>
                  ) : (
                    editingId ? 'Actualizar' : 'Crear'
                  )}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}