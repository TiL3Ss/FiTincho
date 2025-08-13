// components/crud/modal.tsx
'use client';

import React, { useState } from 'react';
import { XMarkIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

// Definición de tipos (interfaces) para tus datos
interface User {
  id: number;
  username: string;
}
interface MuscleGroup {
  id: number;
  name: string;
}
interface Exercise {
  id: number;
  name: string;
  variant: string;
  muscle_group_id: number;
}
interface Series {
  series: number;
  weight: number;
  reps: number;
  rest_time: string;
  progress: number;
  notes: string;
}
interface RoutineExercise {
  name: string;
  variant: string;
  muscle_group: string;
  series: Series[];
}
interface Routine {
  id: number;
  week_number: number;
  day_name: string;
  is_active: number;
  username: string;
  muscle_groups: MuscleGroup[];
  exercises: RoutineExercise[];
  created_at: string;
}
interface ModalProps {
  onClose: () => void;
  onSubmit: (updatedRoutine: any) => Promise<void>;
  routine: Routine | null;
  users: User[];
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const Modal: React.FC<ModalProps> = ({ onClose, onSubmit, routine, users, muscleGroups, exercises }) => {
  
  // Estado principal para el formulario, inicializado con datos de la rutina o valores por defecto
  const [formData, setFormData] = useState({
    id: routine?.id,
    week_number: routine?.week_number || 1,
    day_name: routine?.day_name || 'Lunes',
    is_active: routine?.is_active || 1,
    user_id: routine ? users.find(u => u.username === routine.username)?.id : users[0]?.id,
    exercises: routine?.exercises.map(ex => {
      const exerciseDetails = exercises.find(e => e.name === ex.name && e.variant === ex.variant);
      const muscleGroupDetails = muscleGroups.find(mg => mg.name === ex.muscle_group);
      return {
        exercise_id: exerciseDetails?.id || exercises[0]?.id,
        muscle_group_id: muscleGroupDetails?.id || exercises[0]?.muscle_group_id,
        series: ex.series
      };
    }) || [{
      exercise_id: exercises[0]?.id,
      muscle_group_id: exercises[0]?.muscle_group_id,
      series: [{ series: 1, weight: 0, reps: 0, rest_time: '60s', progress: 0, notes: '' }]
    }],
  });

  const [isSaving, setIsSaving] = useState(false);

  // Función para manejar cambios generales en inputs y selects simples (semana, día, usuario)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Función para manejar cuando se cambia el grupo muscular de un ejercicio específico
  const handleMuscleGroupChange = (exIndex: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    const muscleGroupId = parseInt(e.target.value);

    // Buscar el primer ejercicio disponible para este grupo muscular
    const firstExerciseInGroup = exercises.find(ex => ex.muscle_group_id === muscleGroupId);

    setFormData(prev => {
      const updatedExercises = [...prev.exercises];
      updatedExercises[exIndex] = {
        ...updatedExercises[exIndex],
        muscle_group_id: muscleGroupId,
        exercise_id: firstExerciseInGroup?.id || 0,
        // Opcional: mantener series existentes o reiniciarlas si no hay
        series: updatedExercises[exIndex].series.length > 0
          ? updatedExercises[exIndex].series
          : [{ series: 1, weight: 0, reps: 0, rest_time: '60s', progress: 0, notes: '' }]
      };
      return { ...prev, exercises: updatedExercises };
    });
  };

  // Función para manejar cuando se cambia el ejercicio dentro de un grupo muscular
  const handleExerciseSelectChange = (exIndex: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    const exerciseId = parseInt(e.target.value);

    setFormData(prev => {
      const updatedExercises = [...prev.exercises];
      updatedExercises[exIndex] = {
        ...updatedExercises[exIndex],
        exercise_id: exerciseId,
      };
      return { ...prev, exercises: updatedExercises };
    });
  };

  // Función para manejar cambios en series de un ejercicio
  const handleSeriesChange = (exIndex: number, seriesIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedExercises = [...prev.exercises];
      const updatedSeries = [...updatedExercises[exIndex].series];
      let newValue: string | number = value;
      if (['weight', 'reps', 'progress'].includes(name)) {
        newValue = parseFloat(value);
      }
      updatedSeries[seriesIndex] = { ...updatedSeries[seriesIndex], [name]: newValue };
      updatedExercises[exIndex] = { ...updatedExercises[exIndex], series: updatedSeries };
      return { ...prev, exercises: updatedExercises };
    });
  };

  // Añadir una nueva serie a un ejercicio específico
  const handleAddSeries = (exIndex: number) => {
    setFormData(prev => {
      const updatedExercises = [...prev.exercises];
      updatedExercises[exIndex] = {
        ...updatedExercises[exIndex],
        series: [
          ...updatedExercises[exIndex].series,
          { series: updatedExercises[exIndex].series.length + 1, weight: 0, reps: 0, rest_time: '60s', progress: 0, notes: '' }
        ],
      };
      return { ...prev, exercises: updatedExercises };
    });
  };

  // Eliminar una serie específica de un ejercicio
  const handleRemoveSeries = (exIndex: number, seriesIndex: number) => {
    setFormData(prev => {
      const updatedExercises = [...prev.exercises];
      const updatedSeries = updatedExercises[exIndex].series.filter((_, i) => i !== seriesIndex)
        .map((s, i) => ({ ...s, series: i + 1 })); // Reenumerar las series
      updatedExercises[exIndex] = { ...updatedExercises[exIndex], series: updatedSeries };
      return { ...prev, exercises: updatedExercises };
    });
  };

  // Añadir un nuevo ejercicio vacío (inicializado con primer grupo muscular y ejercicio correspondiente)
  const handleAddExercise = () => {
    const firstMuscleGroup = muscleGroups[0];
    const firstExerciseInGroup = exercises.find(ex => ex.muscle_group_id === firstMuscleGroup.id);

    setFormData(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          exercise_id: firstExerciseInGroup?.id || exercises[0]?.id,
          muscle_group_id: firstMuscleGroup?.id || exercises[0]?.muscle_group_id,
          series: [
            { series: 1, weight: 0, reps: 0, rest_time: '60s', progress: 0, notes: '' }
          ],
        }
      ],
    }));
  };

  // Eliminar un ejercicio específico
  const handleRemoveExercise = (exIndex: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== exIndex),
    }));
  };

  // Función para enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSubmit(formData);
    setIsSaving(false);
  };

  // Filtra los ejercicios disponibles según el grupo muscular seleccionado
  const availableExercises = (muscleGroupId: number) =>
    exercises.filter(ex => ex.muscle_group_id === muscleGroupId);

  // Títulos y textos dinámicos según si es edición o creación
  const title = routine ? 'Editar Rutina' : 'Agregar Nueva Rutina';
  const submitButtonText = routine ? 'Guardar Cambios' : 'Crear Rutina';

  return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white/97 backdrop-blur-sm p-8 rounded-2xl shadow-2xl shadow-black/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border border-white/50">
        
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 bg-gray-200/60 hover:bg-red-500 hover:text-white rounded-full p-1 transition"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-600">
          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <select
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-full bg-gray-100/80 shadow-inner p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={!!routine}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>

          {/* Semana */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Semana</label>
            <input
              type="number"
              name="week_number"
              value={formData.week_number}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-full bg-gray-100/80 shadow-inner p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Día */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Día</label>
            <select
              name="day_name"
              value={formData.day_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-full bg-gray-100/80 shadow-inner p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {/* Lista de ejercicios */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Ejercicios</h3>
            {formData.exercises.map((ex, exIndex) => (
              <div key={exIndex} className="p-4 border border-gray-200 rounded-xl bg-white/70 hover:bg-white/90 transition shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-800">Ejercicio {exIndex + 1}</h4>
                  <button type="button" onClick={() => handleRemoveExercise(exIndex)} className="text-red-500 hover:text-red-700">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Grupo Muscular */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grupo Muscular</label>
                  <select
                    name="muscle_group_id"
                    value={ex.muscle_group_id}
                    onChange={(e) => handleMuscleGroupChange(exIndex, e)}
                    className="mt-1 block w-full border border-gray-300 rounded-full bg-gray-100/80 shadow-inner p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {muscleGroups.map(mg => (
                      <option key={mg.id} value={mg.id}>{mg.name}</option>
                    ))}
                  </select>
                </div>

                {/* Ejercicio */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">Ejercicio</label>
                  <select
                    name="exercise_id"
                    value={ex.exercise_id}
                    onChange={(e) => handleExerciseSelectChange(exIndex, e)}
                    className="mt-1 block w-full border border-gray-300 rounded-full bg-gray-100/80 shadow-inner p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {availableExercises(ex.muscle_group_id).map(exercise => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name} {exercise.variant ? `(${exercise.variant})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Series */}
                <div className="mt-4 space-y-2">
                  <div className="flex space-x-2 items-center text-xs font-medium text-gray-500 mb-1">
                    <h6 className="text-sm font-medium">Series</h6>
                    <span className="w-1/5 text-center">Peso (kg)</span>
                    <span className="w-1/5 text-center">Reps</span>
                    <span className="w-1/5 text-center">Descanso</span>
                    <span className="w-1/5 text-center">Progreso</span>
                  </div>
                  {ex.series.map((serie, seriesIndex) => (
                    <div key={seriesIndex} className="flex space-x-2 items-center">
                      <p className="w-12">S{serie.series}:</p>
                      <input
                        type="number"
                        name="weight"
                        value={serie.weight}
                        onChange={(e) => handleSeriesChange(exIndex, seriesIndex, e)}
                        className="w-1/4 border border-gray-300 rounded-full bg-gray-100/80 p-1 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        type="number"
                        name="reps"
                        value={serie.reps}
                        onChange={(e) => handleSeriesChange(exIndex, seriesIndex, e)}
                        className="w-1/4 border border-gray-300 rounded-full bg-gray-100/80 p-1 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        type="text"
                        name="rest_time"
                        value={serie.rest_time}
                        onChange={(e) => handleSeriesChange(exIndex, seriesIndex, e)}
                        className="w-1/4 border border-gray-300 rounded-full bg-gray-100/80 p-1 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <div className="w-1/4 flex flex-col items-center">
                        <span className="text-sm font-semibold">{serie.progress}</span>
                        <input
                          type="range"
                          name="progress"
                          min="-90"
                          max="90"
                          step="1"
                          value={serie.progress}
                          onChange={(e) => handleSeriesChange(exIndex, seriesIndex, e)}
                          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                      {ex.series.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSeries(exIndex, seriesIndex)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => handleAddSeries(exIndex)} className="flex items-center text-sm text-blue-500 hover:text-blue-700 transition">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Añadir Serie
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddExercise}
              className="flex items-center justify-center w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 transition"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Añadir Ejercicio
            </button>
          </div>

          {/* Botón submit */}
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transition ${
                isSaving
                  ? 'bg-emerald-400 cursor-not-allowed text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {isSaving ? 'Guardando...' : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;
