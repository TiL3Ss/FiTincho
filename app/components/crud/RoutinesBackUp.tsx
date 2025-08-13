// components/crud/RoutinesBackUp.tsx
'use client';

import { useState, useEffect } from 'react';
import { TrashIcon, ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, FolderIcon, FolderOpenIcon, UserIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon as ArrowLeftIconS } from '@heroicons/react/24/solid';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  is_moderator: boolean;
  created_at: string;
  updated_at: string;
}

interface Exercise {
  id: number;
  name: string;
  variant?: string;
  muscle_group: string;
  series: {
    series: number;
    weight: number;
    reps: number;
    rest_time: string;
    progress: number;
  }[];
}

interface Routine {
  id: number;
  name?: string;
  description?: string;
  week_number: number;
  day_name: string;
  is_active: number;
  user_id?: number;
  username?: string;
  muscle_groups: any[];
  exercises: Exercise[];
  created_at: string;
  updated_at?: string;
}

interface GroupedRoutine extends Omit<Routine, 'user_id' | 'username'> {
  user_ids: number[];
  usernames: string[];
  users: User[];
  routine_ids: number[]; // IDs originales de las rutinas agrupadas
}

interface RoutinesBackUpProps {
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onClose: () => void;
}

// Función para obtener color del grupo muscular
const getBorderColorClass = (muscleGroup: string) => {
  switch (muscleGroup.toLowerCase()) {
    case 'pecho':
      return 'border-red-500 bg-red-50';
    case 'espalda':
      return 'border-blue-500 bg-blue-50';
    case 'piernas':
      return 'border-green-500 bg-green-50';
    case 'hombros':
      return 'border-yellow-500 bg-yellow-50';
    case 'brazos':
      return 'border-purple-500 bg-purple-50';
    case 'abdomen':
      return 'border-pink-500 bg-pink-50';
    default:
      return 'border-gray-300 bg-gray-50';
  }
};

export default function RoutinesBackUp({ showNotification, onClose }: RoutinesBackUpProps) {
  const [routines, setRoutines] = useState<GroupedRoutine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<number>>(new Set());

  // Cargar rutinas con información completa y agruparlas
  const fetchRoutines = async () => {
    try {
      setTableLoading(true);
      const response = await fetch('/api/admin/routines');
      if (!response.ok) throw new Error('Error al cargar rutinas');
      const data: Routine[] = await response.json();
      
      // Agrupar rutinas equivalentes
      const groupedMap = new Map<string, GroupedRoutine>();

      data.forEach(routine => {
        // Clave: semana + día + conjunto ordenado de IDs de ejercicios (sin importar el orden)
        const exerciseIds = routine.exercises.map(ex => ex.id).sort((a, b) => a - b);
        const key = `${routine.week_number}-${routine.day_name}-${exerciseIds.join(',')}`;

        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            ...routine,
            user_ids: routine.user_id ? [routine.user_id] : [],
            usernames: routine.username ? [routine.username] : [],
            users: [],
            routine_ids: [routine.id],
          });
        } else {
          const existing = groupedMap.get(key)!;
          
          // Agregar user_id si no existe
          if (routine.user_id && !existing.user_ids.includes(routine.user_id)) {
            existing.user_ids.push(routine.user_id);
          }
          
          // Agregar username si no existe
          if (routine.username && !existing.usernames.includes(routine.username)) {
            existing.usernames.push(routine.username);
          }
          
          // Agregar routine_id
          existing.routine_ids.push(routine.id);
        }
      });

      setRoutines(Array.from(groupedMap.values()));
    } catch (error) {
      showNotification('Error al cargar rutinas', 'error');
      console.error('Error fetching routines:', error);
    } finally {
      setTableLoading(false);
    }
  };

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      showNotification('Error al cargar usuarios', 'error');
      console.error('Error fetching users:', error);
    }
  };

  // Relacionar usuarios con rutinas agrupadas
  useEffect(() => {
    if (users.length > 0 && routines.length > 0) {
      const updatedRoutines = routines.map(routine => {
        const routineUsers: User[] = [];
        
        // Buscar usuarios por user_id
        routine.user_ids.forEach(userId => {
          const user = users.find(u => u.id === userId);
          if (user && !routineUsers.find(ru => ru.id === user.id)) {
            routineUsers.push(user);
          }
        });
        
        // Buscar usuarios por username si no se encontraron por ID
        routine.usernames.forEach(username => {
          const user = users.find(u => u.username === username);
          if (user && !routineUsers.find(ru => ru.id === user.id)) {
            routineUsers.push(user);
          }
        });

        return {
          ...routine,
          users: routineUsers
        };
      });
      
      setRoutines(updatedRoutines);
    }
  }, [users]);

  useEffect(() => {
    fetchRoutines();
    fetchUsers();
  }, []);

  // Toggle rutina expandida
  const toggleRoutine = (routineId: number) => {
    const newExpanded = new Set(expandedRoutines);
    if (newExpanded.has(routineId)) {
      newExpanded.delete(routineId);
    } else {
      newExpanded.add(routineId);
    }
    setExpandedRoutines(newExpanded);
  };

  // Cambiar estado de TODAS las rutinas del grupo
  const toggleRoutineStatus = async (routine: GroupedRoutine, currentStatus: number) => {
    try {
      setLoading(true);
      const newStatus = currentStatus ? 0 : 1;
      
      // Actualizar todas las rutinas del grupo
      const updatePromises = routine.routine_ids.map(routineId =>
        fetch(`/api/admin/routines/${routineId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_active: newStatus
          }),
        })
      );

      const responses = await Promise.all(updatePromises);
      
      // Verificar que todas las respuestas sean exitosas
      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al actualizar el estado de la rutina');
        }
      }

      showNotification(
        `${routine.routine_ids.length} rutina(s) ${newStatus ? 'activada(s)' : 'desactivada(s)'} correctamente`,
        'success'
      );
      
      // Actualizar el estado local
      setRoutines(prevRoutines => 
        prevRoutines.map(r => 
          r.id === routine.id 
            ? { ...r, is_active: newStatus }
            : r
        )
      );
    } catch (error: any) {
      showNotification(error.message || 'Error al actualizar el estado de las rutinas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar TODAS las rutinas del grupo
  const handleDelete = async (routine: GroupedRoutine) => {
    const routineCount = routine.routine_ids.length;
    const userCount = routine.users.length;
    
    if (!confirm(
      `¿Estás seguro de que quieres eliminar esta rutina?\n\n` +
      `Se eliminarán ${routineCount} rutina(s) de ${userCount} usuario(s):\n` +
      `${routine.users.map(u => `${u.first_name} ${u.last_name}`).join(', ')}`
    )) return;

    try {
      setLoading(true);
      
      // Eliminar todas las rutinas del grupo
      const deletePromises = routine.routine_ids.map(routineId =>
        fetch(`/api/admin/routines/${routineId}`, {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(deletePromises);
      
      // Verificar que todas las respuestas sean exitosas
      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al eliminar rutina');
        }
      }

      showNotification(`${routineCount} rutina(s) eliminada(s) correctamente`, 'success');
      fetchRoutines();
    } catch (error: any) {
      showNotification(error.message || 'Error al eliminar rutinas', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col text-gray-700">
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
          <h2 className="text-2xl font-bold text-gray-800">Almacenamiento de rutinas</h2>
        </div>
      </div>

      {/* Lista de rutinas */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Rutinas de Entrenamiento</h3>
            {tableLoading && <p className="text-sm text-gray-500">Cargando rutinas...</p>}
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {tableLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {routines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay rutinas registradas
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {routines.map((routine) => {
                      const isExpanded = expandedRoutines.has(routine.id);
                      const isActive = Boolean(routine.is_active);
                      const exerciseCount = routine.exercises?.length || 0;
                      const userCount = routine.users.length;
                      const routineCount = routine.routine_ids.length;

                      return (
                        <div key={routine.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Header de la rutina */}
                          <div className={`flex items-center justify-between p-4 transition-colors ${
                            isActive 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200' 
                              : 'bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200'
                          }`}>
                            <div 
                              onClick={() => toggleRoutine(routine.id)}
                              className="flex items-center space-x-3 flex-1 cursor-pointer"
                            >
                              {isExpanded ? (
                                <FolderOpenIcon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-red-600'}`} />
                              ) : (
                                <FolderIcon className={`h-5 w-5 ${isActive ? 'text-emerald-500' : 'text-red-500'}`} />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-gray-800">
                                      {routine.name || `Rutina Semana ${routine.week_number} - ${routine.day_name}`}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {userCount > 1 ? (
                                        <UsersIcon className="h-4 w-4 text-gray-500" />
                                      ) : (
                                        <UserIcon className="h-4 w-4 text-gray-500" />
                                      )}
                                      <p className="text-sm text-gray-600">
                                        {userCount > 0 ? (
                                          userCount === 1 ? 
                                            `${routine.users[0].first_name} ${routine.users[0].last_name}` :
                                            `${userCount} usuarios`
                                        ) : (
                                          routine.usernames.length > 0 ? 
                                            `@${routine.usernames.join(', @')}` : 
                                            'Usuario no encontrado'
                                        )}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Semana: {routine.week_number} • Día: {routine.day_name} • Ejercicios: {exerciseCount}
                                    </p>
                                    {routineCount > 1 && (
                                      <p className="text-xs text-blue-600 font-medium">
                                        {routineCount} rutinas agrupadas
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                      Creado: {new Date(routine.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {exerciseCount} ejercicios
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
                                  handleDelete(routine);
                                }}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Detalles expandidos */}
                          {isExpanded && (
                            <div className="bg-white p-4">
                              <div className="space-y-4">
                                {routine.description && (
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-1">Descripción:</h5>
                                    <p className="text-sm text-gray-600">{routine.description}</p>
                                  </div>
                                )}
                                
                                {/* Información general de la rutina */}
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium text-gray-700">Semana:</span>
                                      <p className="text-gray-600">{routine.week_number}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">Día:</span>
                                      <p className="text-gray-600">{routine.day_name}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-700">Estado global:</span>
                                      <label className="inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          className="sr-only peer"
                                          checked={isActive}
                                          onChange={() => toggleRoutineStatus(routine, routine.is_active)}
                                          disabled={loading}
                                        />
                                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                      </label>
                                    </div>
                                    <p className={`font-medium text-sm mt-1 ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                                      {isActive ? 'Rutinas Activas' : 'Rutinas Inactivas'}
                                    </p>
                                    {routineCount > 1 && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Cambios aplicados a {routineCount} rutinas idénticas
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Lista de usuarios con rutinas */}
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 mb-3">
                                    Usuarios con esta rutina ({userCount}):
                                  </h5>
                                  <div className="grid grid-cols-1 gap-3">
                                    {routine.users.map((user, index) => (
                                      <div key={user.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <UserIcon className="h-4 w-4 text-white" />
                                          </div>
                                          <div>
                                            <p className="text-gray-800 font-medium">
                                              {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                            {user.username && (
                                              <p className="text-xs text-blue-600">@{user.username}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}>
                                            {isActive ? 'Activa' : 'Inactiva'}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Usuarios no encontrados */}
                                    {routine.usernames.filter(username => 
                                      !routine.users.some(user => user.username === username)
                                    ).map((username, index) => (
                                      <div key={`username-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                                            <UserIcon className="h-4 w-4 text-white" />
                                          </div>
                                          <div>
                                            <p className="text-gray-600 font-medium">@{username}</p>
                                            <p className="text-xs text-gray-400">Usuario no encontrado en BD</p>
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            No encontrado
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Lista de ejercicios mejorada */}
                                {routine.exercises && routine.exercises.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                                      Plan de ejercicios ({routine.exercises.length}):
                                    </h5>
                                    <div className="space-y-3 max-h-96 overflow-auto">
                                      {routine.exercises.map((exercise, index) => (
                                        <div
                                          key={index}
                                          className={`p-4 border-l-4 rounded-lg ${getBorderColorClass(exercise.muscle_group)} border border-gray-200`}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <div>
                                              <p className="font-semibold text-base text-gray-900">
                                                {exercise.name}
                                              </p>
                                              {exercise.variant && (
                                                <p className="text-sm text-gray-600 italic">({exercise.variant})</p>
                                              )}
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-white rounded-full border">
                                              {exercise.muscle_group}
                                            </span>
                                          </div>
                                          
                                          {exercise.series && exercise.series.length > 0 && (
                                            <div className="mt-3">
                                              <div className="grid grid-cols-5 gap-3 text-xs font-semibold text-gray-600 border-b border-gray-300 pb-2 mb-2">
                                                <div>Serie</div>
                                                <div>Peso (kg)</div>
                                                <div>Reps</div>
                                                <div>Descanso</div>
                                                <div>Progreso</div>
                                              </div>
                                              <div className="space-y-2">
                                                {exercise.series.map((serie, serieIndex) => {
                                                  const isNegative = serie.progress < 0;
                                                  const progressPercent = Math.min(Math.abs((serie.progress / 90) * 100), 100);

                                                  return (
                                                    <div
                                                      key={serieIndex}
                                                      className="grid grid-cols-5 gap-3 py-2 text-sm items-center bg-white bg-opacity-50 rounded px-2"
                                                    >
                                                      <div className="font-medium">#{serie.series}</div>
                                                      <div className="font-semibold">{serie.weight}kg</div>
                                                      <div>{serie.reps} reps</div>
                                                      <div className="text-xs text-gray-600">{serie.rest_time}</div>
                                                      <div className="relative w-full h-5 bg-gray-200 rounded-lg overflow-hidden">
                                                        <div
                                                          style={{ width: `${progressPercent}%` }}
                                                          className={`h-full flex items-center justify-center text-xs font-bold text-white transition-all ${
                                                            isNegative ? 'bg-red-500' : 'bg-emerald-500'
                                                          }`}
                                                        >
                                                          <span className="text-[10px]">{serie.progress}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Información técnica */}
                                <div className="text-xs text-gray-400 pt-3 border-t border-gray-100 bg-gray-50 rounded-lg p-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="font-medium text-gray-600 mb-1">Información técnica:</p>
                                      <p>Rutinas agrupadas: {routineCount}</p>
                                      <p>IDs: {routine.routine_ids.join(', ')}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-600 mb-1">Fechas:</p>
                                      <p>
                                        Creado: {new Date(routine.created_at).toLocaleDateString()}
                                      </p>
                                      {routine.updated_at && (
                                        <p>
                                          Actualizado: {new Date(routine.updated_at).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}