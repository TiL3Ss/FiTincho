// components/crud/list_rutina/RoutineDetails.tsx

'use client';

import React, { useState } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Series {
  series: number;
  weight: number;
  reps: number | string;
  rest_time: string;
  progress: number;
  notes?: string;
}

interface Exercise {
  name: string;
  variant?: string;
  muscle_group: string;
  series: Series[];
}

interface MuscleGroup {
  id: number;
  name: string;
}

interface Routine {
  id: number;
  week_number: number;
  day_name: string;
  is_active: number;
  username: string;
  muscle_groups: MuscleGroup[];
  exercises: Exercise[];
  created_at: string;
  muscle_group_frequency?: { [key: string]: number };
}

interface RoutineDetailsProps {
  routine: Routine;
  onEdit: (routine: Routine) => void;
  onDelete: (id: number) => void;
  onToggleActive?: (routineId: number, currentStatus: number) => void;
  isLoading?: boolean;
}

const getBorderColorClass = (muscleGroup: string) => {
  const normalizedGroup = muscleGroup.toLowerCase().trim();
  
  const colorMap: { [key: string]: string } = {
    'pecho': 'border-red-500 bg-red-50',
    'espalda': 'border-blue-500 bg-blue-50',
    'piernas': 'border-green-500 bg-green-50',
    'hombros': 'border-yellow-500 bg-yellow-50',
    'brazos': 'border-purple-500 bg-purple-50',
    'bíceps': 'border-purple-500 bg-purple-50',
    'tríceps': 'border-purple-500 bg-purple-50',
    'abdomen': 'border-pink-500 bg-pink-50',
    'glúteos': 'border-orange-500 bg-orange-50',
    'pantorrillas': 'border-teal-500 bg-teal-50',
    'antebrazos': 'border-indigo-500 bg-indigo-50',
    'cardio': 'border-cyan-500 bg-cyan-50',
  };

  return colorMap[normalizedGroup] || 'border-gray-300 bg-gray-50';
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

const RoutineDetails: React.FC<RoutineDetailsProps> = ({ 
  routine, 
  onEdit, 
  onDelete, 
  onToggleActive,
  isLoading = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleActive = () => {
    if (onToggleActive && !isLoading) {
      onToggleActive(routine.id, routine.is_active);
    }
  };

  const handleEdit = () => {
    if (!isLoading) {
      onEdit(routine);
    }
  };

  const handleDelete = () => {
    if (!isLoading) {
      onDelete(routine.id);
    }
  };

  // Calcular estadísticas
  const totalExercises = routine.exercises.length;
  const totalSeries = routine.exercises.reduce((total, exercise) => total + exercise.series.length, 0);
  const muscleGroupsInvolved = routine.muscle_groups.length;

  return (
    <div className={`bg-white/95 backdrop-blur-md p-6 rounded-2xl border shadow-lg transition-all duration-300 hover:shadow-xl ${
      routine.is_active 
        ? 'border-emerald-200 ring-1 ring-emerald-100' 
        : 'border-gray-200 opacity-75'
    }`}>
      
      {/* Header con información básica */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              routine.is_active 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {routine.is_active ? 'Activa' : 'Inactiva'}
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Semana {routine.week_number}
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <UserIcon className="h-4 w-4 mr-1" />
              {routine.username}
            </div>
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <ClockIcon className="h-3 w-3 mr-1" />
            Creada: {formatDate(routine.created_at)}
          </div>
        </div>

        {/* Botón para expandir/contraer */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={isExpanded ? "Contraer detalles" : "Expandir detalles"}
        >
          {isExpanded ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{totalExercises}</div>
          <div className="text-xs text-blue-700">Ejercicios</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">{totalSeries}</div>
          <div className="text-xs text-purple-700">Series</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-600">{muscleGroupsInvolved}</div>
          <div className="text-xs text-orange-700">Grupos</div>
        </div>
      </div>

      {/* Grupos musculares involucrados */}
      {routine.muscle_groups.length > 0 && (
        <div className="mb-4">
          <h6 className="text-xs font-semibold text-gray-700 mb-2">Grupos musculares:</h6>
          <div className="flex flex-wrap gap-1">
            {routine.muscle_groups.map((mg) => (
              <span
                key={mg.id}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {mg.name}
                {routine.muscle_group_frequency?.[mg.name] && 
                  ` (${routine.muscle_group_frequency[mg.name]})`
                }
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detalles expandibles de ejercicios */}
      {isExpanded && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h5 className="font-semibold text-base text-gray-800 mb-3 flex items-center">
            <span className="mr-2">📋</span>
            Ejercicios detallados
          </h5>
          
          <div className="space-y-4">
            {routine.exercises.map((exercise, index) => (
              <div
                key={index}
                className={`p-4 border-l-4 rounded-r-lg transition-all duration-200 hover:shadow-sm ${getBorderColorClass(exercise.muscle_group)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-base text-gray-900">
                      {exercise.name}
                      {exercise.variant && (
                        <span className="ml-2 text-sm text-gray-600 font-normal">
                          ({exercise.variant})
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-1">💪</span>
                      {exercise.muscle_group}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-white bg-opacity-70 rounded-full">
                    {exercise.series.length} series
                  </span>
                </div>

                {/* Tabla de series */}
                <div className="mt-3">
                  <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-700 border-b border-gray-300 pb-2 mb-2">
                    <div>Serie</div>
                    <div>Peso</div>
                    <div>Reps</div>
                    <div>Descanso</div>
                    <div>Progreso</div>
                    <div>Notas</div>
                  </div>
                  
                  <div className="space-y-1">
                    {exercise.series.map((serie, serieIndex) => {
                      const isNegative = serie.progress < 0;
                      const progressPercent = Math.min(Math.abs((serie.progress / 100) * 100), 100);

                      return (
                        <div
                          key={serieIndex}
                          className="grid grid-cols-6 gap-2 py-2 text-sm border-b border-gray-100 last:border-0 items-center hover:bg-white hover:bg-opacity-50 rounded px-1"
                        >
                          <div className="font-medium">#{serie.series}</div>
                          <div>{serie.weight} kg</div>
                          <div>{serie.reps}</div>
                          <div className="text-xs">{serie.rest_time}</div>
                          
                          {/* Barra de progreso mejorada */}
                          <div className="relative">
                            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${progressPercent}%` }}
                                className={`h-full flex items-center justify-center text-xs font-semibold text-white transition-all duration-300 ${
                                  isNegative 
                                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                }`}
                              />
                            </div>
                            <span className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${
                              progressPercent > 50 ? 'text-white' : 'text-gray-700'
                            }`}>
                              {serie.progress}%
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500 truncate" title={serie.notes}>
                            {serie.notes || '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-2">
        {onToggleActive && (
          <button
            onClick={handleToggleActive}
            disabled={isLoading}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              routine.is_active
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
            title={routine.is_active ? "Desactivar rutina" : "Activar rutina"}
          >
            {routine.is_active ? (
              <EyeSlashIcon className="h-4 w-4 mr-1" />
            ) : (
              <EyeIcon className="h-4 w-4 mr-1" />
            )}
            {routine.is_active ? 'Desactivar' : 'Activar'}
          </button>
        )}

        <button
          onClick={handleEdit}
          disabled={isLoading}
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Editar
        </button>
        
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Eliminar
        </button>
      </div>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-2xl flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
            <span>Procesando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineDetails;