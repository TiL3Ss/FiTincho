// components/crud/list_rutina/RoutineDetails.tsx

'use client';

import React from 'react';

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
  switch (muscleGroup.toLowerCase()) {
    case 'pecho':
      return 'border-red-500';        // Rojo
    case 'espalda':
      return 'border-blue-500';       // Azul
    case 'piernas':
      return 'border-green-500';      // Verde
    case 'hombros':
      return 'border-yellow-500';     // Amarillo
    case 'brazos':
      return 'border-purple-500';     // Morado
    case 'abdomen':
      return 'border-pink-500';       // Rosa
    default:
      return 'border-gray-300';       // Gris neutro
  }
};

const RoutineDetails: React.FC<RoutineDetailsProps> = ({ 
  routine, 
  onEdit, 
  onDelete, 
  onToggleActive,
  isLoading = false 
}) => {
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

  return (
    <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white/40 shadow-md">
      <p className="text-sm text-gray-600">
        Estado: {routine.is_active ? 'Activa' : 'Inactiva'}
      </p>

      <div className="mt-3">
        <h5 className="font-semibold text-lg text-gray-800 mb-2">Ejercicios:</h5>
        {routine.exercises.map((exercise, index) => (
          <div
            key={index}
            className={`ml-2 mt-3 p-3 border-l-4 bg-gray-100/70 rounded-lg ${getBorderColorClass(exercise.muscle_group)}`}
          >
            <p className="font-semibold text-base text-gray-900">
              {exercise.name} {exercise.variant && `(${exercise.variant})`}
            </p>
            <p className="text-xs text-gray-500">Grupo muscular: {exercise.muscle_group}</p>
            <div className="mt-2">
              <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-600 border-b border-gray-300 pb-1">
                <div>Serie</div>
                <div>Peso (kg)</div>
                <div>Repeticiones</div>
                <div>Descanso</div>
                <div>Progreso</div>
              </div>
              <div className="mt-1 text-gray-800 text-sm">
                {exercise.series.map((serie, serieIndex) => {
                  // Define colores y porcentaje absoluto para barra
                  const isNegative = serie.progress < 0;
                  const progressPercent = Math.abs((serie.progress / 90) * 100);

                  return (
                    <div
                      key={serieIndex}
                      className="grid grid-cols-5 gap-4 py-1 border-b border-gray-200 last:border-0 items-center"
                    >
                      <div>S{serie.series}</div>
                      <div>{serie.weight}</div>
                      <div>{serie.reps}</div>
                      <div>{serie.rest_time}</div>
                      <div className="relative w-full h-6 bg-gray-200 rounded-xl overflow-hidden">
                        <div
                          style={{ width: `${progressPercent}%` }}
                          className={`h-full flex items-center justify-center text-xs font-semibold text-white rounded-xl transition-colors ${
                            isNegative ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        >
                          {serie.progress}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        {onToggleActive && (
          <button
            onClick={handleToggleActive}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition duration-300 shadow disabled:opacity-50 ${
              routine.is_active
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {routine.is_active ? 'Desactivar' : 'Activar'}
          </button>
        )}
        
        <button
          onClick={handleEdit}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition duration-300 shadow disabled:opacity-50"
        >
          Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition duration-300 shadow disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default RoutineDetails;