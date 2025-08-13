// app/components/ResetPasswordModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import NotificationToast from './NotificationToast';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess?: () => void;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ 
  isOpen, 
  onClose, 
  token, 
  onSuccess 
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Limpiar estado cuando se cierra el modal
  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsLoading(false);
    setIsValidatingToken(true);
    setTokenValid(false);
    hideNotification();
    onClose();
  };

  // Validar token cuando se abre el modal
  useEffect(() => {
    const validateToken = async () => {
      if (!isOpen || !token) {
        return;
      }

      setIsValidatingToken(true);
      hideNotification();

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          showNotification(data.message || 'Token inválido o expirado.', 'error');
        }
      } catch (error) {
        console.error('Error validando token:', error);
        setTokenValid(false);
        showNotification('Error de conexión. Inténtalo más tarde.', 'error');
      } finally {
        setIsValidatingToken(false);
      }
    };

    if (isOpen) {
      validateToken();
    }
  }, [isOpen, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    hideNotification();

    // Validaciones
    if (!newPassword || !confirmPassword) {
      showNotification('Por favor, completa todos los campos.', 'warning');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres.', 'warning');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('Las contraseñas no coinciden.', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión.', 'success');
        
        // Llamar callback de éxito si existe
        if (onSuccess) {
          onSuccess();
        }
        
        // Cerrar modal después de 3 segundos
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        showNotification(data.message || 'Error al restablecer la contraseña.', 'error');
      }
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      showNotification('Error de conexión. Inténtalo más tarde.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // No renderizar si el modal está cerrado
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Notificación Toast */}
      {notification.show && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          duration={notification.type === 'success' ? 4000 : 4000}
          onClose={hideNotification}
          persistent={notification.type === 'error' || isLoading}
        />
      )}

      {/* Modal Overlay */}
      <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative mx-4">
          {/* Título */}
          <h2 className="text-2xl font-bold mb-6 text-center text-green-500">
            Restablecer Contraseña
          </h2>
          
          {/* Botón para cerrar el modal */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`absolute top-3 right-3 text-2xl font-semibold transition-colors ${
              isLoading 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:text-red-700'
            }`}
            aria-label="Cerrar"
          >
            &times;
          </button>

          {/* Loading mientras valida el token */}
          {isValidatingToken && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Validando enlace...</p>
            </div>
          )}

          {/* Error de token inválido */}
          {!isValidatingToken && !tokenValid && (
            <div className="text-center py-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Enlace Inválido o Expirado
              </h3>
              <p className="text-gray-600 mb-6">
                Este enlace de recuperación no es válido o ha expirado.
              </p>
              <button
                onClick={handleClose}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Formulario de reset - solo se muestra si el token es válido */}
          {!isValidatingToken && tokenValid && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center text-gray-600 text-sm mb-6">
                Ingresa tu nueva contraseña para completar el restablecimiento.
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1 ml-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-5 py-2.5 pr-12 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none focus:shadow-outline-green transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
                    placeholder="Ingresa tu nueva contraseña"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-600 hover:text-green-800"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 ml-2">
                  Debe tener al menos 6 caracteres
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 ml-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-2.5 pr-12 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none focus:shadow-outline-green transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
                    placeholder="Confirma tu nueva contraseña"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-600 hover:text-green-800"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-semibold text-white text-sm px-5 py-2.5 text-center rounded-full transition duration-300 ease-in-out ${
                    isLoading 
                      ? 'bg-green-400 cursor-not-allowed' 
                      : 'bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
                  }`}
                >
                  {isLoading ? 'Actualizando Contraseña...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ResetPasswordModal;