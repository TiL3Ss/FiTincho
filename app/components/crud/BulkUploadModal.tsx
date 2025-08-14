// components/crud/BulkUploadModal.tsx
'use client';

import { useState } from 'react';
import { XMarkIcon, CloudArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (uploadData: any) => Promise<any>;
  users: User[];
}

const BulkUploadModal = ({ isOpen, onClose, onUpload, users }: BulkUploadModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [jsonData, setJsonData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!selectedUserId) {
        throw new Error('Debe seleccionar un usuario');
      }

      if (!jsonData.trim()) {
        throw new Error('Debe proporcionar los datos de la rutina en formato JSON');
      }

      // Validar que el JSON es válido
      let parsedRoutine;
      try {
        parsedRoutine = JSON.parse(jsonData);
      } catch (jsonError) {
        throw new Error('El JSON proporcionado no es válido');
      }

      // Preparar los datos para el upload
      const uploadData = {
        userId: selectedUserId,
        routine: {
          ...parsedRoutine,
          weekNumber: weekNumber
        }
      };

      // Llamar a la función de upload
      await onUpload(uploadData);
      
      // Limpiar el formulario y cerrar
      setSelectedUserId('');
      setWeekNumber(1);
      setJsonData('');
      onClose();

    } catch (err) {
      console.error('Error in bulk upload:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError('');
      setSelectedUserId('');
      setWeekNumber(1);
      setJsonData('');
      onClose();
    }
  };

  // Ejemplo de estructura JSON
  const exampleJson = {
    "userName": "usuario_ejemplo",
    "weekNumber": 1,
    "days": [
      {
        "day": "Lunes",
        "weekNumber": 1,
        "muscleGroups": [
          {
            "name": "Pecho",
            "exercises": [
              {
                "name": "Press Banca",
                "variant": "Plano",
                "data": [
                  {
                    "series": 1,
                    "weight": 80,
                    "reps": "12",
                    "rest": 90,
                    "progress": 0
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Carga Masiva de Rutinas</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario *
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="">Seleccionar usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id.toString()}>
                    {user.username} {user.first_name && user.last_name && `(${user.first_name} ${user.last_name})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Número de Semana */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Semana *
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {/* Datos JSON */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datos de la Rutina (JSON) *
              </label>
              <textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder="Pegue aquí los datos de la rutina en formato JSON..."
                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                required
              />
            </div>

            {/* Ejemplo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Ejemplo de estructura JSON:</h3>
              <pre className="text-xs text-gray-600 overflow-x-auto bg-white p-3 rounded border">
                {JSON.stringify(exampleJson, null, 2)}
              </pre>
            </div>

            {/* Advertencia */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-800 text-sm">
                  <strong>Atención:</strong> Esta operación reemplazará todas las rutinas existentes 
                  del usuario para la semana seleccionada. Los datos existentes se eliminarán de forma permanente.
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedUserId || !jsonData.trim()}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cargando...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    Cargar Rutina
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;