// components/crud/RoutineUploader.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  ArrowUpTrayIcon, 
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { ArrowLeftIcon as ArrowLeftIconS } from '@heroicons/react/24/solid';
import ExcelJS from 'exceljs';

interface RoutineUploaderProps {
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onClose: () => void;
  selectedUserId?: string;
  users?: Array<{ id: string; name: string; email: string }>;
}

interface ExerciseData {
  series: number;
  weight: number;
  reps: string;
  rest: number;
  progress: number;
}

interface ParsedExercise {
  name: string;
  variant: string;
  data: ExerciseData[];
}

interface ParsedMuscleGroup {
  name: string;
  exercises: ParsedExercise[];
}

interface ParsedRoutineDay {
  day: string;
  weekNumber: number;
  muscleGroups: ParsedMuscleGroup[];
}

interface ParsedRoutine {
  userName: string;
  weekNumber: number;
  days: ParsedRoutineDay[];
}

interface FileProcessResult {
  success: boolean;
  routine?: ParsedRoutine;
  errors: string[];
  warnings: string[];
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function getGroupColor(groupName: string): string {
  switch (groupName.toLowerCase()) {
    case 'pecho': return 'bg-red-100 text-red-800 border-red-200';
    case 'espalda': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'piernas': return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'hombros': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'brazos': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'abdomen': return 'bg-pink-100 text-pink-800 border-pink-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export default function RoutineUploader({ 
  showNotification, 
  onClose, 
  selectedUserId,
  users = [] 
}: RoutineUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processResult, setProcessResult] = useState<FileProcessResult | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>(selectedUserId || '');
  const [availableUsers, setAvailableUsers] = useState(users);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para cargar usuarios desde la API
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const userData = await response.json();
      
      // Verificar que userData es un array válido
      if (Array.isArray(userData)) {
        setAvailableUsers(userData);
      } else {
        console.error('Los datos de usuarios no son un array:', userData);
        setAvailableUsers([]);
        showNotification('Formato de datos de usuarios inválido', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAvailableUsers([]);
      
      // Si es un error de red o la API no existe, no mostrar notificación de error
      if (error instanceof Error && error.message.includes('404')) {
        console.log('API /api/admin/users no encontrada, usando lista vacía');
      } else {
        showNotification('Error al cargar usuarios', 'error');
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // Cargar usuarios solo cuando sea necesario
  const loadUsersIfNeeded = async () => {
    if (availableUsers.length === 0 && !loadingUsers && users.length === 0) {
      await fetchUsers();
    }
  };

  // Solo establecer usuarios de props al inicio, no hacer llamada API automática
  useEffect(() => {
    if (users.length > 0) {
      setAvailableUsers(users);
      setLoadingUsers(false);
    }
    // NO hacer fetchUsers() automáticamente aquí
  }, [users]);

  // Actualizar usuario seleccionado cuando cambien las props
  useEffect(() => {
    if (selectedUserId && availableUsers.length > 0 && !selectedUser) {
      setSelectedUser(selectedUserId);
    }
  }, [selectedUserId, availableUsers, selectedUser]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const processExcelFile = async (file: File): Promise<FileProcessResult> => {
    const result: FileProcessResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // Extraer información del nombre del archivo
      const fileName = file.name.replace('.xlsx', '');
      const fileNameParts = fileName.split('_');
      
      let userName = 'Usuario';
      let weekNumber = 1;
      
      if (fileNameParts.length >= 4) {
        userName = fileNameParts.slice(1, -2).join(' ');
        weekNumber = parseInt(fileNameParts[fileNameParts.length - 1]) || 1;
      }

      const parsedDays: ParsedRoutineDay[] = [];

      workbook.worksheets.forEach((worksheet) => {
        const sheetName = worksheet.name;
        const dayMatch = sheetName.match(/^(.+?)\s*-\s*Semana/);
        
        if (!dayMatch) {
          result.warnings.push(`Hoja "${sheetName}" no sigue el formato esperado`);
          return;
        }

        const day = dayMatch[1].trim();
        if (!DAYS.includes(day)) {
          result.warnings.push(`Día "${day}" no es válido`);
          return;
        }

        const muscleGroups: ParsedMuscleGroup[] = [];
        let currentGroup: ParsedMuscleGroup | null = null;
        let currentExercise: ParsedExercise | null = null;
        let lastGroupName = '';
        let lastExerciseName = '';
        let lastVariantName = '';

        // 🔍 Función auxiliar para obtener valor real de celda (maneja merged cells)
        const getCellValue = (row: ExcelJS.Row, colNumber: number): string => {
          const cell = row.getCell(colNumber);
          
          // Si la celda tiene valor, devolverlo
          if (cell.value !== null && cell.value !== undefined && cell.value.toString().trim() !== '') {
            return cell.value.toString().trim();
          }
          
          // Si no tiene valor, podría ser una celda merged - buscar el valor de la celda master
          if (cell.master && cell.master.value !== null && cell.master.value !== undefined) {
            return cell.master.value.toString().trim();
          }
          
          return '';
        };

        // Procesar filas (comenzar desde la fila 2, saltando headers)
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          
          // Saltar filas completamente vacías o filas espaciadoras (altura muy pequeña)
          if (row.actualCellCount === 0 || (row.height !== undefined && row.height <= 5)) {
            continue;
          }

          // Obtener valores usando la función auxiliar para manejar merged cells
          const grupoMuscular = getCellValue(row, 1);
          const ejercicio = getCellValue(row, 2);
          const variante = getCellValue(row, 3);
          const series = parseInt(getCellValue(row, 4) || '0');
          const peso = parseFloat(getCellValue(row, 5) || '0');
          const repeticiones = getCellValue(row, 6) || '';
          const descanso = parseInt(getCellValue(row, 7) || '0');
          const progresion = parseFloat(getCellValue(row, 8) || '0');

          // 🔄 Mantener valores anteriores si están vacíos (efecto de merged cells)
          const currentGroupName = grupoMuscular || lastGroupName;
          const currentExerciseName = ejercicio || lastExerciseName;
          const currentVariantName = variante || lastVariantName;

          // Solo procesar si tenemos datos válidos de serie
          if (series <= 0) continue;

          // 🏋️ Manejar grupo muscular
          if (currentGroupName && currentGroupName !== lastGroupName) {
            // Guardar ejercicio anterior si existe
            if (currentExercise && currentExercise.data.length > 0 && currentGroup) {
              currentGroup.exercises.push(currentExercise);
              currentExercise = null;
            }
            
            // Guardar grupo anterior si existe
            if (currentGroup && currentGroup.exercises.length > 0) {
              muscleGroups.push(currentGroup);
            }
            
            // Crear nuevo grupo
            currentGroup = {
              name: currentGroupName,
              exercises: []
            };
            
            lastGroupName = currentGroupName;
          }

          // 🏋️‍♀️ Manejar ejercicios
          if (currentExerciseName && (currentExerciseName !== lastExerciseName || currentVariantName !== lastVariantName)) {
            // Guardar ejercicio anterior si existe
            if (currentExercise && currentExercise.data.length > 0 && currentGroup) {
              currentGroup.exercises.push(currentExercise);
            }
            
            // Crear nuevo ejercicio
            currentExercise = {
              name: currentExerciseName,
              variant: currentVariantName || '',
              data: []
            };
            
            lastExerciseName = currentExerciseName;
            lastVariantName = currentVariantName;
          }

          // 📊 Agregar datos de serie
          if (currentExercise && currentGroup) {
            currentExercise.data.push({
              series,
              weight: peso,
              reps: repeticiones,
              rest: descanso,
              progress: progresion
            });
          } else {
            // Si no tenemos ejercicio actual, crear uno con el nombre actual
            if (currentExerciseName && currentGroup) {
              currentExercise = {
                name: currentExerciseName,
                variant: currentVariantName || '',
                data: [{
                  series,
                  weight: peso,
                  reps: repeticiones,
                  rest: descanso,
                  progress: progresion
                }]
              };
              lastExerciseName = currentExerciseName;
              lastVariantName = currentVariantName;
            }
          }
        }

        // ✅ Guardar último ejercicio y grupo
        if (currentExercise && currentExercise.data.length > 0 && currentGroup) {
          currentGroup.exercises.push(currentExercise);
        }
        if (currentGroup && currentGroup.exercises.length > 0) {
          muscleGroups.push(currentGroup);
        }

        if (muscleGroups.length > 0) {
          parsedDays.push({
            day,
            weekNumber,
            muscleGroups
          });
        }
      });

      if (parsedDays.length === 0) {
        result.errors.push('No se encontraron rutinas válidas en el archivo');
        return result;
      }

      result.success = true;
      result.routine = {
        userName,
        weekNumber,
        days: parsedDays
      };

    } catch (error) {
      result.errors.push(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    return result;
  };

  const handleFile = async (file: File) => {
    // Validar tipo de archivo
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      showNotification('Solo se permiten archivos .xlsx', 'error');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('El archivo es demasiado grande (máximo 10MB)', 'error');
      return;
    }

    setProcessing(true);
    setProcessResult(null);

    try {
      const result = await processExcelFile(file);
      setProcessResult(result);

      if (result.success) {
        showNotification('Archivo procesado correctamente', 'success');
      } else {
        showNotification('Error al procesar el archivo', 'error');
      }
    } catch (error) {
      showNotification('Error inesperado al procesar el archivo', 'error');
      setProcessResult({
        success: false,
        errors: ['Error inesperado al procesar el archivo'],
        warnings: []
      });
    } finally {
      setProcessing(false);
    }
  };

  const uploadRoutine = async () => {
    if (!processResult?.routine) {
      showNotification('No hay rutina procesada para cargar', 'warning');
      return;
    }

    // Cargar usuarios si no están disponibles
    if (availableUsers.length === 0) {
      await loadUsersIfNeeded();
      // Después de cargar, verificar si tenemos usuarios
      if (availableUsers.length === 0) {
        showNotification('No se pudieron cargar los usuarios', 'error');
        return;
      }
    }

    if (!selectedUser) {
      showNotification('Selecciona un usuario para continuar', 'warning');
      return;
    }

    setUploading(true);

    try {
      const response = await fetch('/api/admin/routines/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          routine: processResult.routine
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir la rutina');
      }

      showNotification('Rutina cargada exitosamente', 'success');
      setProcessResult(null);
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      showNotification(error.message || 'Error al cargar la rutina', 'error');
    } finally {
      setUploading(false);
    }
  };

  const clearResult = () => {
    setProcessResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <h2 className="text-2xl font-bold text-gray-800">Cargar Rutinas desde Excel</h2>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Panel de carga - 40% */}
        <div className="w-2/5 flex-shrink-0 flex flex-col">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Subir Archivo de Rutina</h3>
              <p className="text-sm text-gray-600 mt-1">
                Arrastra y suelta un archivo .xlsx o haz clic para seleccionar
              </p>
            </div>
            
            <div className="flex-1 p-6">
              {/* Zona de arrastre */}
              <div
                className={`relative border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center transition-colors ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${processing ? 'pointer-events-none opacity-50' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {processing ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600 font-medium">Procesando archivo...</p>
                  </div>
                ) : (
                  <>
                    <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Arrastra tu archivo Excel aquí
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      o haz clic para seleccionar desde tu computadora
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center space-x-2 shadow-md"
                    >
                      <ArrowUpTrayIcon className="h-5 w-5" />
                      <span>Seleccionar archivo</span>
                    </button>
                  </>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Formato esperado */}
              <div className="mt-6 bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Formato esperado del archivo
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Nombre: <code>Rutina_NombreUsuario_Semana_X.xlsx</code></li>
                  <li>• Cada hoja debe llamarse: <code>DíaDeLaSemana - Semana X</code></li>
                  <li>• Columnas: Grupo Muscular, Ejercicio, Variante, Series, Peso, Repeticiones, Descanso, Progresión</li>
                  <li>• ✅ <strong>Acepta series múltiples:</strong> puedes dejar vacío el ejercicio en las siguientes filas</li>
                  <li>• Los grupos musculares se agrupan automáticamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de resultados y configuración - 60% */}
        <div className="flex-1 flex flex-col space-y-6">
          {/* Selector de usuario */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Usuario destinatario</h3>
            {loadingUsers ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
                <span className="ml-2 text-gray-600">Cargando usuarios...</span>
              </div>
            ) : (
              <>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={availableUsers.length === 0}
                >
                  <option value="">
                    {availableUsers.length === 0 ? 'No hay usuarios disponibles' : 'Seleccionar usuario'}
                  </option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name}  {user.last_name}
                    </option>
                  ))}
                </select>
                
                {/* Información adicional */}
                <div className="mt-2 text-sm text-gray-600">
                  {availableUsers.length > 0 ? (
                    <span>✅ {availableUsers.length} usuario(s) disponible(s)</span>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">⚠️ No se pudieron cargar usuarios</span>
                      <button 
                        onClick={fetchUsers}
                        className="ml-2 text-emerald-600 hover:text-emerald-700 underline text-xs"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Resultados del procesamiento */}
          {processResult && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Resultado del procesamiento</h3>
                <button
                  onClick={clearResult}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Estado general */}
              <div className={`flex items-center p-3 rounded-lg mb-4 ${
                processResult.success 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {processResult.success ? (
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                ) : (
                  <XCircleIcon className="h-5 w-5 mr-2" />
                )}
                <span className="font-medium">
                  {processResult.success ? 'Archivo procesado correctamente' : 'Error al procesar archivo'}
                </span>
              </div>

              {/* Errores */}
              {processResult.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-700 mb-2">Errores:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {processResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advertencias */}
              {processResult.warnings.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-yellow-700 mb-2">Advertencias:</h4>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    {processResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resumen de la rutina */}
              {processResult.success && processResult.routine && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Resumen de la rutina:</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Usuario:</span> {processResult.routine.userName}</p>
                      <p><span className="font-medium">Semana:</span> {processResult.routine.weekNumber}</p>
                      <p><span className="font-medium">Días:</span> {processResult.routine.days.length}</p>
                    </div>
                  </div>

                  {/* Vista previa de días con tabla */}
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    {processResult.routine.days.map((day, dayIndex) => (
                      <div key={dayIndex} className="mb-4">
                        {/* Header del día */}
                        <div className="bg-emerald-600 text-white px-4 py-2 font-semibold text-sm rounded-t-lg">
                          {day.day} - Semana {day.weekNumber}
                        </div>
                        
                        {/* Tabla de ejercicios */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="px-2 py-2 text-left font-medium text-gray-700">G.M</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-700">Ejercicio</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-700">Variante</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700">Serie</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700">Peso</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700">Reps</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700">Descanso</th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.muscleGroups.map((group, groupIndex) => {
                                const groupRowSpan = group.exercises.reduce((acc, ex) => acc + ex.data.length, 0);
                                let currentRow = 0;
                                
                                return group.exercises.map((exercise, exerciseIndex) => 
                                  exercise.data.map((data, serieIndex) => {
                                    currentRow++;
                                    const isFirstRowOfGroup = currentRow === 1;
                                    const isFirstRowOfExercise = serieIndex === 0;
                                    const exerciseRowSpan = exercise.data.length;
                                    
                                    return (
                                      <tr key={`${groupIndex}-${exerciseIndex}-${serieIndex}`} className="border-b border-gray-100 hover:bg-gray-50">
                                        {/* Grupo Muscular - solo en la primera fila del grupo */}
                                        {isFirstRowOfGroup && (
                                          <td 
                                            rowSpan={groupRowSpan}
                                            className={`px-2 py-2 border-r border-gray-200 font-medium align-middle ${getGroupColor(group.name).replace('border-', 'bg-').replace('-200', '-50')} ${getGroupColor(group.name).split(' ')[1]}`}
                                            style={{ verticalAlign: 'middle' }}
                                          >
                                            {group.name}
                                          </td>
                                        )}
                                        
                                        {/* Ejercicio - solo en la primera serie del ejercicio */}
                                        {isFirstRowOfExercise && (
                                          <td 
                                            rowSpan={exerciseRowSpan} 
                                            className="px-2 py-2 border-r border-gray-200 font-medium align-middle"
                                            style={{ verticalAlign: 'middle' }}
                                          >
                                            {exercise.name}
                                          </td>
                                        )}
                                        
                                        {/* Variante - solo en la primera serie del ejercicio */}
                                        {isFirstRowOfExercise && (
                                          <td 
                                            rowSpan={exerciseRowSpan} 
                                            className="px-2 py-2 border-r border-gray-200 text-gray-600 align-middle"
                                            style={{ verticalAlign: 'middle' }}
                                          >
                                            {exercise.variant || '-'}
                                          </td>
                                        )}
                                        
                                        {/* Datos de la serie */}
                                        <td className="px-2 py-2 text-center bg-blue-50 text-blue-800 font-medium">{data.series}</td>
                                        <td className="px-2 py-2 text-center bg-gray-50 text-gray-800 font-medium">{data.weight}kg</td>
                                        <td className="px-2 py-2 text-center bg-orange-50 text-orange-800 font-medium">{data.reps}</td>
                                        <td className="px-2 py-2 text-center bg-purple-50 text-purple-800 font-medium">{data.rest}s</td>
                                      </tr>
                                    );
                                  })
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        
                        {dayIndex < processResult.routine.days.length - 1 && (
                          <div className="h-4 bg-gray-100 border-b"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Botón de carga */}
                  <button
                    onClick={uploadRoutine}
                    disabled={uploading || !selectedUser}
                    className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Cargando...</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        <span>Cargar rutina</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}