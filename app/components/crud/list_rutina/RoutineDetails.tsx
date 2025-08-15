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
  color_gm: string;
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
}

// Función para obtener la clase de color del borde basada en color_gm
const getBorderColorClass = (colorGm: string | null | undefined) => {
  // Verificar si colorGm existe y no es null/undefined
  if (!colorGm) {
    return 'border-gray-300'; // Color por defecto si no hay color_gm
  }

  // Mapear los valores de color_gm de la base de datos a clases de Tailwind
  switch (colorGm.toLowerCase()) {
    case 'coral':
      return 'border-orange-500';
    case 'ocean':
      return 'border-blue-500';
    case 'forest':
      return 'border-green-500';
    case 'lavender':
      return 'border-purple-500';
    case 'golden':
      return 'border-yellow-500';
    case 'rose':
      return 'border-pink-500';
    case 'sky':
      return 'border-sky-500';
    case 'mint':
      return 'border-teal-500';
    case 'sunset':
      return 'border-orange-600';
    case 'aurora':
      return 'border-indigo-500';
    case 'emerald':
      return 'border-emerald-500';
    case 'twilight':
      return 'border-slate-600';
    // Mantener compatibilidad con valores básicos de colores
    case 'red':
    case 'rojo':
      return 'border-red-500';
    case 'blue':
    case 'azul':
      return 'border-blue-500';
    case 'green':
    case 'verde':
      return 'border-green-500';
    case 'yellow':
    case 'amarillo':
      return 'border-yellow-500';
    case 'purple':
    case 'morado':
      return 'border-purple-500';
    case 'pink':
    case 'rosa':
      return 'border-pink-500';
    case 'cyan':
    case 'celeste':
      return 'border-cyan-500';
    case 'orange':
    case 'naranja':
      return 'border-orange-500';
    case 'indigo':
    case 'añil':
      return 'border-indigo-500';
    case 'teal':
      return 'border-teal-500';
    case 'lime':
      return 'border-lime-500';
    case 'violet':
    case 'violeta':
      return 'border-violet-500';
    case 'fuchsia':
      return 'border-fuchsia-500';
    default:
      return 'border-gray-300'; // Color por defecto si no se reconoce el color
  }
};

// Función para encontrar el grupo muscular por nombre
const findMuscleGroupByName = (muscleGroups: MuscleGroup[], muscleGroupName: string): MuscleGroup | undefined => {
  // Verificar que muscleGroups existe y es un array
  if (!muscleGroups || !Array.isArray(muscleGroups) || !muscleGroupName) {
    return undefined;
  }
  
  return muscleGroups.find(group => 
    group?.name?.toLowerCase() === muscleGroupName.toLowerCase()
  );
};

const RoutineDetails: React.FC<RoutineDetailsProps> = ({ routine, onEdit, onDelete }) => {
  return (
    <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white/40 shadow-md">
      <p className="text-sm text-gray-600">
        Estado: {routine.is_active ? 'Activa' : 'Inactiva'}
      </p>

      <div className="mt-3">
        <h5 className="font-semibold text-lg text-gray-800 mb-2">Ejercicios:</h5>
        {routine.exercises.map((exercise, index) => {
          // Buscar el grupo muscular correspondiente para obtener su color_gm
          const muscleGroup = findMuscleGroupByName(routine.muscle_groups, exercise.muscle_group);
          const borderColorClass = getBorderColorClass(muscleGroup?.color_gm);

          return (
            <div
              key={index}
              className={`ml-2 mt-3 p-3 border-l-4 bg-gray-100/70 rounded-lg ${borderColorClass}`}
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
          );
        })}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => onEdit(routine)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition duration-300 shadow"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(routine.id)}
          className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition duration-300 shadow"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default RoutineDetails;