// app/ficha_completa/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { exportRoutineExcel } from '../utils/exportRoutineExcel';
import Header from '../components/Header';
import DaySelector from '../components/DaySelector';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseGroupSelector from '../components/ExerciseGroupSelector';
import WeekSelector from '../components/WeekSelector';
import UserSelector from '../components/UserSelector';
import type { Metadata } from 'next'


import { useProfile } from '../hooks/useProfile';
import { useRoutines } from '../hooks/useRoutines';
import { useRouter } from 'next/navigation';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { UserIcon  } from '@heroicons/react/24/solid';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export async function generateMetadata(): Promise<Metadata> {
  return {

    title: 'Ficha Completa - {selectedUserName} | FitWW',
    description: '{`Visualiza y descarga la ficha completa de ${selectedUserName}. Selecciona semanas, días y grupos musculares para ver los ejercicios detallados.`}',
  }
}


export default function FichaCompleta() {
  const router = useRouter();
  
  // Hooks existentes
  const { 
    profileUser, 
    isOwnProfile, 
    isLoading: profileLoading, 
    error: profileError,
    displayName,
    isAuthenticated,
    sessionStatus
  } = useProfile();

  const {
    users,
    weeks,
    isLoading: routinesLoading,
    error: routinesError,
    canEdit,
    isModerator,
    currentUserId,
    fetchRoutines,
    refreshData
  } = useRoutines();

  // Estados locales
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);


  useEffect(() => {
  if (
    selectedUserId &&
    isModerator &&
    selectedUserId !== loadedUserId
  ) {
    fetchRoutines(selectedUserId).then(() => {
      setLoadedUserId(selectedUserId);
    });
  }
}, [selectedUserId, isModerator, loadedUserId, fetchRoutines]);


  // Efecto para inicializar selectedUserId cuando se cargan los datos
  useEffect(() => {
    if (!selectedUserId && users.length > 0 && currentUserId) {
      if (isModerator) {
        setSelectedUserId(users[0].id); // primer usuario
      } else {
        setSelectedUserId(currentUserId);
      }
    }
  }, [users, currentUserId, isModerator, selectedUserId]);

  

 


  // Handlers existentes
  const handleLoginClick = () => {
    router.push('/login');
  };
  
  const handleRegisterClick = () => {
    router.push('/register');
  };
  
  const handleLogout = async () => {
    try {
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/');
    }
  };

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    setLoadedUserId(null);
  };

  // Datos procesados
  const currentWeek = weeks.find(w => w.weekNumber === selectedWeek);
  const currentRoutine = currentWeek?.routines.find(r => r.day === selectedDay);
  const muscleGroups = currentRoutine?.muscleGroups || [];
  const exercises = muscleGroups.find(g => g.id === selectedGroupId)?.exercises || [];
  const availableWeeks = weeks.map(w => w.weekNumber);


  // Loading states
  if (profileLoading || sessionStatus === 'loading' || routinesLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">
            {profileLoading || sessionStatus === 'loading' ? 'Cargando perfil...' : 'Cargando rutinas...'}
          </p>
        </div>
      </div>
    );
  }

  // Error states
  if (profileError || routinesError) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-white to-pink-50 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-red-200/50">
          <p className="text-red-600 text-lg mb-6 font-medium">
            {profileError || routinesError}
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Volver al inicio
            </button>
            <button 
              onClick={refreshData}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // valores para el largo de etiqueta de ficha
  const selectedUserName = users.find(u => u.id === selectedUserId)?.name || 'Usuario';
  const cornerWidth = Math.max(64, selectedUserName.length * 15); 

  const allMuscleGroupsThisWeek = currentWeek
  ? currentWeek.routines.flatMap(routine => routine.muscleGroups)
  : [];
  const frequencyMap = new Map<string, number>();

  allMuscleGroupsThisWeek.forEach(group => {
  frequencyMap.set(group.id, (frequencyMap.get(group.id) || 0) + 1);});

  const muscleGroupsWithFrequency = muscleGroups.map(group => ({
    ...group,
    frequency: frequencyMap.get(group.id) || 0
  }));

  const handleDownload = async () => {
  if (!weeks || weeks.length === 0) {
    alert('No hay rutinas para descargar.');
    return;
  }

    try {
        const selectedUserName = users.find(u => u.id === selectedUserId)?.name || 'Usuario';

        const currentWeek = weeks.find(w => w.weekNumber === selectedWeek);

        if (!currentWeek || !Array.isArray(currentWeek.routines) || currentWeek.routines.length === 0) {
          throw new Error('No hay datos para exportar o el formato es incorrecto.');
        }

        await exportRoutineExcel(selectedWeek, currentWeek.routines, selectedUserName);

      } catch (error) {
        console.error('Error al generar el archivo Excel:', error);
        alert('Error al generar el archivo Excel. Por favor, inténtalo de nuevo.\n' + (error instanceof Error ? error.message : error));
      }
    };

  return (
   

    
    <div className="bg-gradient-to-br from-green-200 via-green-500/30 to-green-300/30 min-h-screen flex flex-col">
      {/* Header principal */}
      <Header
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
        isLoggedIn={isAuthenticated}
        onLogout={handleLogout}
        username={displayName}
        userProfile={profileUser}
        isOwnProfile={isOwnProfile}
        isModerator={isModerator} 
      />

      {/* UserSelector como segundo header - solo visible para moderadores */}
      {isModerator && users.length > 1 && (
        <UserSelector
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={handleUserSelect}
        />
      )}

      <div className="flex flex-1 p-6 space-x-6">
        {/* Principio de Ficha */}
        <div className="flex-1 flex flex-col">
          <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-2xl flex-1 overflow-y-auto border border-white/50">
            {/* Fondo Esquina */}
            <div
              className="absolute top-0 left-0 h-16 bg-emerald-600 rounded-br-2xl z-0 shadow-md transition-all duration-300"
              style={{ width: `${cornerWidth}px` }}
            ></div>
            {/* User de la esquina */}
            <div className="relative z-110 text-white font-semibold flex items-center space-x-2">
              <div className="bg-white/20 rounded-full p-1.5">
                <UserIcon className="h-4 w-4" />
              </div>
              <span className="text-sm text-gray-60 truncate max-w-[180px]"> {users.find(u => u.id === selectedUserId)?.name || 'Usuario'}</span>
              
            </div>
            {/* WeekSelector, DaySelector y botón de descarga juntos */}
            <div className="flex items-center gap-4 mb-6">
              {/* Identificador User - Ahora alineado a la izquierda */}
             <div className="relative mr-auto w-fit"></div>

              {/* WeekSelector */}
              <WeekSelector
                weeks={availableWeeks}
                selectedWeek={selectedWeek}
                onSelectWeek={setSelectedWeek}
              />

              {/* DaySelector */}
              <DaySelector
                days={DAYS}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
              
              {/* BOTÓN DE DESCARGA - Ahora con tamaño consistente */}
              <div className="bg-white/70 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/50 w-[280px]">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 transform hover:scale-101 disabled:transform-none border border-green-400/30 group font-semibold"
                  disabled={!currentRoutine}
                >
                  <div className="bg-white/20 rounded-full p-1.5 mr-3 group-hover:bg-white/30 transition-all duration-300">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Descargar Semana (Excel)</span>
                </button>
              </div>
            </div>

            {/* Contenido de ejercicios */}
            {selectedGroupId ? (
              exercises.length > 0 ? (
                <>
                  {/* Headers de las columnas */}
                  <div className="flex items-stretch gap-0 mb-6 sticky top-0 bg-white/90 backdrop-blur-sm z-10 rounded-2xl shadow-lg border border-gray-100/50">
                    <div className="w-56 p-4 bg-gradient-to-r from-slate-600 to-slate-700 rounded-l-2xl text-white font-bold flex items-center justify-center shadow-sm">
                      <span className="text-sm">Ejercicio</span>
                    </div>
                    <div className="flex-1 rounded-r-2xl shadow-sm">
                      <div className="grid grid-cols-6 gap-0 p-0">
                        <div className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 font-bold p-4 flex items-center justify-center">
                          <span className="text-sm">Serie</span>
                        </div>
                        <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-bold p-4 flex items-center justify-center">
                          <span className="text-sm">Peso</span>
                        </div>
                        <div className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 font-bold p-4 flex items-center justify-center">
                          <span className="text-sm">Reps</span>
                        </div>
                        <div className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 font-bold p-4 flex items-center justify-center">
                          <span className="text-sm">Descanso</span>
                        </div>
                        <div className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 font-bold p-4 flex items-center justify-center">
                          <span className="text-sm">Progreso</span>
                        </div>
                        <div className="bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 font-bold p-4 flex items-center justify-center rounded-r-2xl">
                          <span className="text-sm">Ajuste</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de ejercicios */}
                  <div className="space-y-2">
                    {exercises.map(exercise => (
                      <ExerciseCard key={exercise.id} exercise={exercise} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-yellow-50 rounded-3xl p-8 inline-block shadow-lg border border-yellow-200/50">
                    <p className="text-gray-600 font-medium text-lg">No hay ejercicios para este grupo muscular.</p>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <div className="bg-blue-50 rounded-3xl p-8 inline-block shadow-lg border border-blue-200/50">
                  <p className="text-gray-600 font-medium text-lg">
                    {muscleGroups.length > 0 
                      ? 'Selecciona un grupo muscular para ver los ejercicios.'
                      : 'No hay rutinas disponibles para este día.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* ExerciseGroupSelector al final */}
            {muscleGroups.length > 0 && (
              <div className="flex-none p-2 pt-0">
                <ExerciseGroupSelector
                  groups={muscleGroupsWithFrequency}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={setSelectedGroupId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Contenedor de la derecha */}
        <div className="flex-none flex flex-col items-center">
          {/* Información del usuario seleccionado (solo para moderadores) */}
          
        </div>
      </div>
    </div>
    
  );
}