// components/crud/ExercisesCrud.tsx
'use client';

import { useState, useEffect } from 'react';
import { TrashIcon, PencilSquareIcon, ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { TrashIcon as TrashIconS, PencilSquareIcon as PencilSquareIconS, ArrowLeftIcon as ArrowLeftIconS } from '@heroicons/react/24/solid';
import ColorSelect from '../ui/ColorSelect';

interface Exercise {
  id: number;
  name: string;
  variant?: string;
  muscle_group_id?: number;
  muscle_group_name?: string;
  created_at: string;
  updated_at: string;
}

interface MuscleGroup {
  id: number;
  name: string;
  color_gm?: string;
  created_at: string;
  updated_at: string;
}

interface ExerciseFormData {
  name: string;
  variant: string;
  muscle_group_id: number | '';
}

interface MuscleGroupFormData {
  name: string;
  color_gm: string;
}

interface ExercisesCrudProps {
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onClose: () => void;
}

interface GroupedExercises {
  [key: string]: {
    group: MuscleGroup | null;
    exercises: Exercise[];
  };
}

type FormMode = 'exercise' | 'muscleGroup';

// Mapeo de colores para obtener gradientes
const getColorGradient = (colorValue: string): string => {
  const colorMap: Record<string, string> = {
    coral: 'from-orange-400 via-pink-400 to-red-400',
    ocean: 'from-blue-400 via-cyan-400 to-teal-400',
    forest: 'from-green-400 via-emerald-400 to-teal-500',
    lavender: 'from-purple-400 via-violet-400 to-indigo-400',
    golden: 'from-yellow-400 via-orange-400 to-amber-500',
    rose: 'from-pink-400 via-rose-400 to-red-400',
    sky: 'from-sky-400 via-blue-400 to-indigo-400',
    mint: 'from-teal-400 via-green-400 to-emerald-400',
    sunset: 'from-orange-400 via-red-400 to-pink-500',
    aurora: 'from-indigo-400 via-purple-400 to-pink-400',
    emerald: 'from-emerald-400 via-green-500 to-teal-500',
    twilight: 'from-slate-600 via-purple-500 to-indigo-500'
  };
  return colorMap[colorValue] || colorMap.ocean;
};

const initialExerciseFormData: ExerciseFormData = {
  name: '',
  variant: '',
  muscle_group_id: ''
};

const initialMuscleGroupFormData: MuscleGroupFormData = {
  name: '',
  color_gm: 'ocean'
};

export default function ExercisesCrud({ showNotification, onClose }: ExercisesCrudProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exerciseFormData, setExerciseFormData] = useState<ExerciseFormData>(initialExerciseFormData);
  const [muscleGroupFormData, setMuscleGroupFormData] = useState<MuscleGroupFormData>(initialMuscleGroupFormData);
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
  const [editingMuscleGroupId, setEditingMuscleGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [formMode, setFormMode] = useState<FormMode>('exercise');

  // Cargar ejercicios
  const fetchExercises = async () => {
    try {
      setTableLoading(true);
      const response = await fetch('/api/admin/exercises');
      if (!response.ok) throw new Error('Error al cargar ejercicios');
      const data = await response.json();
      
      // Enriquecer los ejercicios con el nombre del grupo muscular
      const enrichedExercises = data.map((exercise: Exercise) => {
        const muscleGroup = muscleGroups.find(mg => mg.id === exercise.muscle_group_id);
        return {
          ...exercise,
          muscle_group_name: muscleGroup?.name || null
        };
      });
      
      setExercises(enrichedExercises);
      console.log('Ejercicios cargados:', enrichedExercises.length);
    } catch (error) {
      console.error('Error al cargar ejercicios:', error);
      showNotification('Error al cargar ejercicios', 'error');
    } finally {
      setTableLoading(false);
    }
  };

  // Cargar grupos musculares
  const fetchMuscleGroups = async () => {
    try {
      const response = await fetch('/api/admin/muscle-groups');
      if (!response.ok) throw new Error('Error al cargar grupos musculares');
      const data = await response.json();
      setMuscleGroups(data);
      console.log('Grupos musculares cargados:', data.length);
      return data; // Devolver los datos para uso inmediato
    } catch (error) {
      console.error('Error al cargar grupos musculares:', error);
      showNotification('Error al cargar grupos musculares', 'error');
      return [];
    }
  };

  useEffect(() => {
    fetchMuscleGroups();
  }, []);

  useEffect(() => {
    if (muscleGroups.length > 0) {
      fetchExercises();
    }
  }, [muscleGroups]);

  // Obtener ejercicios por grupo
  const getExercisesForGroup = (groupId: number): Exercise[] => {
    return exercises.filter(exercise => exercise.muscle_group_id === groupId);
  };

  // Agrupar ejercicios por grupo muscular
  const groupedExercises: GroupedExercises = exercises.reduce((acc, exercise) => {
    const groupKey = exercise.muscle_group_id ? exercise.muscle_group_id.toString() : 'unassigned';
    
    if (!acc[groupKey]) {
      const muscleGroup = muscleGroups.find(mg => mg.id === exercise.muscle_group_id);
      acc[groupKey] = {
        group: muscleGroup || null,
        exercises: []
      };
    }
    
    acc[groupKey].exercises.push(exercise);
    return acc;
  }, {} as GroupedExercises);

  // Toggle grupo expandido
  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  // Manejar cambios en el formulario de ejercicios
  const handleExerciseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExerciseFormData(prev => ({
      ...prev,
      [name]: name === 'muscle_group_id' ? (value === '' ? '' : parseInt(value)) : value
    }));
  };

  // Manejar cambios en el formulario de grupos musculares
  const handleMuscleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMuscleGroupFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambio de color
  const handleColorChange = (color: string) => {
    setMuscleGroupFormData(prev => ({
      ...prev,
      color_gm: color
    }));
  };

  // Validar formulario de ejercicios
  const validateExerciseForm = (): boolean => {
    if (!exerciseFormData.name.trim()) {
      showNotification('El nombre del ejercicio es requerido', 'warning');
      return false;
    }
    return true;
  };

  // Validar formulario de grupos musculares
  const validateMuscleGroupForm = (): boolean => {
    if (!muscleGroupFormData.name.trim()) {
      showNotification('El nombre del grupo muscular es requerido', 'warning');
      return false;
    }
    return true;
  };

  // Crear o actualizar ejercicio
  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateExerciseForm()) return;

    try {
      setLoading(true);
      
      const url = editingExerciseId 
        ? `/api/admin/exercises/${editingExerciseId}` 
        : '/api/admin/exercises';
      
      const method = editingExerciseId ? 'PUT' : 'POST';

      // Preparar datos para envío
      const submitData = {
        ...exerciseFormData,
        muscle_group_id: exerciseFormData.muscle_group_id === '' ? null : exerciseFormData.muscle_group_id,
        variant: exerciseFormData.variant.trim() || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar ejercicio');
      }

      showNotification(
        editingExerciseId ? 'Ejercicio actualizado correctamente' : 'Ejercicio creado correctamente',
        'success'
      );
      
      setExerciseFormData(initialExerciseFormData);
      setEditingExerciseId(null);
      fetchExercises();
    } catch (error: any) {
      showNotification(error.message || 'Error al guardar ejercicio', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Crear o actualizar grupo muscular
  const handleMuscleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateMuscleGroupForm()) return;

    try {
      setLoading(true);
      
      const url = editingMuscleGroupId 
        ? `/api/admin/muscle-groups/${editingMuscleGroupId}` 
        : '/api/admin/muscle-groups';
      
      const method = editingMuscleGroupId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(muscleGroupFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar grupo muscular');
      }

      showNotification(
        editingMuscleGroupId ? 'Grupo muscular actualizado correctamente' : 'Grupo muscular creado correctamente',
        'success'
      );
      
      setMuscleGroupFormData(initialMuscleGroupFormData);
      setEditingMuscleGroupId(null);
      setFormMode('exercise'); // Volver al formulario de ejercicios
      fetchMuscleGroups();
    } catch (error: any) {
      showNotification(error.message || 'Error al guardar grupo muscular', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar ejercicio
  const handleDeleteExercise = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) return;

    try {
      const response = await fetch(`/api/admin/exercises/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar ejercicio');
      }

      showNotification('Ejercicio eliminado correctamente', 'success');
      fetchExercises();
    } catch (error: any) {
      showNotification(error.message || 'Error al eliminar ejercicio', 'error');
    }
  };

  // Eliminar grupo muscular
  const handleDeleteMuscleGroup = async (id: number) => {
    const exerciseCount = getExercisesForGroup(id).length;
    
    if (exerciseCount > 0) {
      showNotification(
        `No se puede eliminar el grupo muscular porque tiene ${exerciseCount} ejercicio${exerciseCount > 1 ? 's' : ''} asignado${exerciseCount > 1 ? 's' : ''}`,
        'warning'
      );
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar este grupo muscular?')) return;

    try {
      const response = await fetch(`/api/admin/muscle-groups/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar grupo muscular');
      }

      showNotification('Grupo muscular eliminado correctamente', 'success');
      fetchMuscleGroups();
    } catch (error: any) {
      showNotification(error.message || 'Error al eliminar grupo muscular', 'error');
    }
  };

  // Editar ejercicio
  const handleEditExercise = (exercise: Exercise) => {
    setExerciseFormData({
      name: exercise.name,
      variant: exercise.variant || '',
      muscle_group_id: exercise.muscle_group_id || ''
    });
    setEditingExerciseId(exercise.id);
    setFormMode('exercise');
  };

  // Editar grupo muscular
  const handleEditMuscleGroup = (group: MuscleGroup) => {
    setMuscleGroupFormData({
      name: group.name,
      color_gm: group.color_gm || 'ocean'
    });
    setEditingMuscleGroupId(group.id);
    setFormMode('muscleGroup');
  };

  // Cancelar edición
  const handleCancel = () => {
    setExerciseFormData(initialExerciseFormData);
    setMuscleGroupFormData(initialMuscleGroupFormData);
    setEditingExerciseId(null);
    setEditingMuscleGroupId(null);
    setFormMode('exercise');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Volver al menú principal"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:transform group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Ejercicios y Grupos</h2>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Lista de ejercicios agrupados */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Ejercicios por Grupo Muscular</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {tableLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.keys(groupedExercises).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay ejercicios registrados
                    </div>
                  ) : (
                    Object.entries(groupedExercises).map(([groupKey, { group, exercises }]) => {
                      const isExpanded = expandedGroups.has(groupKey);
                      const groupName = group ? group.name : 'Sin grupo asignado';
                      const exerciseCount = exercises.length;
                      const colorGradient = group?.color_gm ? getColorGradient(group.color_gm) : 'from-gray-400 to-gray-500';
                      
                      return (
                        <div key={groupKey} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Header del grupo */}
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors border-b">
                            <div 
                              onClick={() => toggleGroup(groupKey)}
                              className="flex items-center space-x-3 flex-1 cursor-pointer"
                            >
                              <div className="relative">
                                {isExpanded ? (
                                  <FolderOpenIcon className="h-5 w-5 text-emerald-600" />
                                ) : (
                                  <FolderIcon className="h-5 w-5 text-gray-500" />
                                )}
                                {group && (
                                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r ${colorGradient} border border-white shadow-sm`} />
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{groupName}</h4>
                                <p className="text-sm text-gray-600">
                                  {exerciseCount} ejercicio{exerciseCount !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                {exerciseCount}
                              </span>
                              {/* Botón de editar grupo muscular (solo si hay grupo) */}
                              {group && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMuscleGroup(group);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                  title="Editar grupo muscular"
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>
                              )}
                              {/* Botón de eliminar grupo muscular (solo si hay grupo y no tiene ejercicios) */}
                              {group && exerciseCount === 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMuscleGroup(group.id);
                                  }}
                                  className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Eliminar grupo muscular"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                              <div onClick={() => toggleGroup(groupKey)} className="cursor-pointer p-1">
                                {isExpanded ? (
                                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Lista de ejercicios */}
                          {isExpanded && (
                            <div className="divide-y divide-gray-100">
                              {exercises.map((exercise) => (
                                <div key={exercise.id} className="p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-3">
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorGradient} flex-shrink-0`}></div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-gray-900 truncate">
                                            {exercise.name}
                                          </p>
                                          {exercise.variant && (
                                            <p className="text-sm text-gray-600 truncate">
                                              {exercise.variant}
                                            </p>
                                          )}
                                          <p className="text-xs text-gray-400 mt-1">
                                            ID: {exercise.id} • Creado: {new Date(exercise.created_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                      <button
                                        onClick={() => handleEditExercise(exercise)}
                                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                      >
                                        <PencilSquareIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteExercise(exercise.id)}
                                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="w-96 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            {/* Selector de formulario */}
            <div className="flex space-x-2 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setFormMode('exercise');
                  if (editingMuscleGroupId) {
                    setMuscleGroupFormData(initialMuscleGroupFormData);
                    setEditingMuscleGroupId(null);
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  formMode === 'exercise'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ejercicios
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormMode('muscleGroup');
                  if (editingExerciseId) {
                    setExerciseFormData(initialExerciseFormData);
                    setEditingExerciseId(null);
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  formMode === 'muscleGroup'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grupos
              </button>
            </div>

            {formMode === 'exercise' ? (
              // Formulario de ejercicios
              <>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {editingExerciseId ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                </h3>
                
                <form onSubmit={handleExerciseSubmit} className="space-y-4 text-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Ejercicio *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={exerciseFormData.name}
                      onChange={handleExerciseInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="ej: Press banca, Remo con barra"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variante
                    </label>
                    <input
                      type="text"
                      name="variant"
                      value={exerciseFormData.variant}
                      onChange={handleExerciseInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="ej: Inclinado con Mancuerna, Agarre supino"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Especifica la variación del ejercicio (opcional)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grupo Muscular
                    </label>
                    <select
                      name="muscle_group_id"
                      value={exerciseFormData.muscle_group_id}
                      onChange={handleExerciseInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Sin asignar</option>
                      {muscleGroups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Asigna el ejercicio a un grupo muscular (opcional)
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ejemplos de ejercicios:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• <span className="font-medium">Press banca:</span> Variante "Con mancuernas"</li>
                      <li>• <span className="font-medium">Sentadillas:</span> Variante "Búlgara"</li>
                      <li>• <span className="font-medium">Remo:</span> Variante "Con barra"</li>
                      <li>• <span className="font-medium">Press militar:</span> Variante "Sentado"</li>
                    </ul>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Guardando...' : (editingExerciseId ? 'Actualizar' : 'Crear')}
                    </button>
                    
                    {editingExerciseId && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </>
            ) : (
              // Formulario de grupos musculares
              <>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {editingMuscleGroupId ? 'Editar Grupo Muscular' : 'Nuevo Grupo Muscular'}
                </h3>
                
                <form onSubmit={handleMuscleGroupSubmit} className="space-y-4 text-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Grupo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={muscleGroupFormData.name}
                      onChange={handleMuscleGroupInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="ej: Pecho, Espalda, Piernas, Hombros"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Describe el grupo de músculos que se trabajarán
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color del Grupo
                    </label>
                    <ColorSelect
                      value={muscleGroupFormData.color_gm}
                      onChange={handleColorChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Selecciona un color para identificar visualmente el grupo
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ejemplos comunes:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• <span className="font-medium">Pecho:</span> Press banca, flexiones, aperturas</li>
                      <li>• <span className="font-medium">Espalda:</span> Remo, pull-ups, dominadas</li>
                      <li>• <span className="font-medium">Piernas:</span> Sentadillas, peso muerto, extensiones</li>
                      <li>• <span className="font-medium">Hombros:</span> Press militar, elevaciones laterales</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Después de crear el grupo, puedes asignarle ejercicios específicos desde el formulario de ejercicios.
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Guardando...' : (editingMuscleGroupId ? 'Actualizar' : 'Crear')}
                    </button>
                    
                    {editingMuscleGroupId && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}