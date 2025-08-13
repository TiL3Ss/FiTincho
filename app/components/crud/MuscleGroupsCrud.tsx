// components/crud/MuscleGroupsCrud.tsx
'use client';

import { useState, useEffect } from 'react';
import { TrashIcon, PencilSquareIcon, ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { TrashIcon as TrashIconS, PencilSquareIcon as PencilSquareIconS, ArrowLeftIcon as ArrowLeftIconS } from '@heroicons/react/24/solid';

interface MuscleGroup {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  exercise_count?: number;
}

interface Exercise {
  id: number;
  name: string;
  variant?: string;
  muscle_group_id: number;
  created_at: string;
  updated_at: string;
}

interface MuscleGroupFormData {
  name: string;
}

interface MuscleGroupsCrudProps {
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onClose: () => void;
}

const initialFormData: MuscleGroupFormData = {
  name: ''
};

export default function MuscleGroupsCrud({ showNotification, onClose }: MuscleGroupsCrudProps) {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [formData, setFormData] = useState<MuscleGroupFormData>(initialFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  // Cargar grupos musculares con conteo de ejercicios
  const fetchMuscleGroups = async () => {
    try {
      setTableLoading(true);
      const response = await fetch('/api/admin/muscle-groups');
      if (!response.ok) throw new Error('Error al cargar grupos musculares');
      const data = await response.json();
      setMuscleGroups(data);
    } catch (error) {
      showNotification('Error al cargar grupos musculares', 'error');
    } finally {
      setTableLoading(false);
    }
  };

  // Cargar ejercicios
  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/admin/exercises');
      if (!response.ok) throw new Error('Error al cargar ejercicios');
      const data = await response.json();
      setExercises(data);
    } catch (error) {
      showNotification('Error al cargar ejercicios', 'error');
    }
  };

  useEffect(() => {
    fetchMuscleGroups();
    fetchExercises();
  }, []);

  // Toggle grupo expandido
  const toggleGroup = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Obtener ejercicios por grupo
  const getExercisesForGroup = (groupId: number): Exercise[] => {
    return exercises.filter(exercise => exercise.muscle_group_id === groupId);
  };

  // Contar ejercicios por grupo
  const getExerciseCount = (groupId: number): number => {
    return exercises.filter(exercise => exercise.muscle_group_id === groupId).length;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validar formulario
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showNotification('El nombre del grupo muscular es requerido', 'warning');
      return false;
    }
    return true;
  };

  // Crear o actualizar grupo muscular
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const url = editingId 
        ? `/api/admin/muscle-groups/${editingId}` 
        : '/api/admin/muscle-groups';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar grupo muscular');
      }

      showNotification(
        editingId ? 'Grupo muscular actualizado correctamente' : 'Grupo muscular creado correctamente',
        'success'
      );
      
      setFormData(initialFormData);
      setEditingId(null);
      fetchMuscleGroups();
    } catch (error: any) {
      showNotification(error.message || 'Error al guardar grupo muscular', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar grupo muscular
  const handleDelete = async (id: number) => {
    const exerciseCount = getExerciseCount(id);
    
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

  // Editar grupo muscular
  const handleEdit = (muscleGroup: MuscleGroup) => {
    setFormData({
      name: muscleGroup.name
    });
    setEditingId(muscleGroup.id);
  };

  // Cancelar edición
  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIconS className="cursor-pointer pt-0.5 text-emerald-800 hover:text-emerald-500  transition-colors h-5 w-5" 
             strokeWidth={2.5}/>
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Grupos Musculares</h2>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Lista de grupos musculares */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Grupos Musculares y Ejercicios</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {tableLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {muscleGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay grupos musculares registrados
                    </div>
                  ) : (
                    muscleGroups.map((group) => {
                      const isExpanded = expandedGroups.has(group.id);
                      const groupExercises = getExercisesForGroup(group.id);
                      const exerciseCount = groupExercises.length;
                      
                      return (
                        <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Header del grupo */}
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors">
                            <div 
                              onClick={() => toggleGroup(group.id)}
                              className="flex items-center space-x-3 flex-1 cursor-pointer"
                            >
                              {isExpanded ? (
                                <FolderOpenIcon className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <FolderIcon className="h-5 w-5 text-gray-500" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-gray-800">{group.name}</h4>
                                    <p className="text-sm text-gray-600">
                                      {exerciseCount} ejercicio{exerciseCount !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      ID: {group.id} • Creado: {new Date(group.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                      {exerciseCount}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Botones de acción */}
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(group);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(group.id);
                                }}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Lista de ejercicios */}
                          {isExpanded && (
                            <div className="bg-white">
                              {groupExercises.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                  No hay ejercicios asignados a este grupo
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-100">
                                  {groupExercises.map((exercise) => (
                                    <div key={exercise.id} className="p-4 hover:bg-gray-50 transition-colors">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></div>
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
                                  ))}
                                </div>
                              )}
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingId ? 'Editar Grupo Muscular' : 'Nuevo Grupo Muscular'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Grupo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="ej: Pecho, Espalda, Piernas, Hombros"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe el grupo de músculos que se trabajarán
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
                  Después de crear el grupo, puedes asignarle ejercicios específicos desde la gestión de ejercicios.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear')}
                </button>
                
                {editingId && (
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
          </div>
        </div>
      </div>
    </div>
  );
}