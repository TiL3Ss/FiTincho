// app/components/LoginModal.tsx
'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { signIn } from 'next-auth/react';
import NotificationToast from './NotificationToast';

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  isPendingRedirect?: boolean;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess, isPendingRedirect = false }) => {
  // Estados para el login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para recuperación de contraseña
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  // Estado para las notificaciones
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

  // Función para manejar el login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hideNotification();
    setIsLoading(true);

    if (!identifier.trim() || !password.trim()) {
      showNotification('Por favor, completa todos los campos.', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        identifier,
        password,
      });

      if (result?.error) {
        showNotification(result.error, 'error');
      } else {
        showNotification('¡Inicio de sesión exitoso! Redirigiendo a tu perfil...', 'success');
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      showNotification('Error de red o del servidor. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar la recuperación de contraseña
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    hideNotification();
    setIsSendingReset(true);

    if (!forgotEmail.trim()) {
      showNotification('Por favor, ingresa tu correo electrónico.', 'warning');
      setIsSendingReset(false);
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      showNotification('Por favor, ingresa un correo electrónico válido.', 'warning');
      setIsSendingReset(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(data.message, 'success');
        // Limpiar el formulario y volver al login después de un tiempo
        setForgotEmail('');
        setTimeout(() => {
          setShowForgotPassword(false);
          hideNotification();
        }, 4000);
      } else {
        showNotification(data.message || 'Error al enviar el correo de recuperación.', 'error');
      }
    } catch (error) {
      console.error('Error al solicitar recuperación:', error);
      showNotification('Error de red. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Función para volver al formulario de login
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    hideNotification();
  };

  return (
    <>
      {/* Notificación Toast */}
      {notification.show && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          duration={notification.type === 'success' ? 4000 : 4000}
          onClose={hideNotification}
          persistent={notification.type === 'error' || isPendingRedirect}
        />
      )}

      {/* Modal */}
      <div className="fixed inset-0 flex justify-center items-center z-50  bg-opacity-30 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
          {/* Título dinámico */}
          <h2 className="text-2xl font-bold mb-6 text-center text-green-500">
            {showForgotPassword ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
          </h2>
          
          {/* Botón para cerrar el modal */}
          <button
            onClick={onClose}
            disabled={isPendingRedirect}
            className={`absolute top-3 right-3 text-2xl font-semibold transition-colors ${
              isPendingRedirect 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:text-red-700'
            }`}
            aria-label="Cerrar"
          >
            &times;
          </button>

          {/* Botón para volver al login (solo visible en forgot password) */}
          {showForgotPassword && (
            <button
              onClick={handleBackToLogin}
              disabled={isSendingReset}
              className="absolute top-3 left-3 text-gray-600 hover:text-green-600 transition-colors"
              aria-label="Volver al login"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          )}

          {/* Formulario de Login */}
          {!showForgotPassword && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1 ml-2">
                  Correo Electrónico o Nombre de Usuario
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full px-5 py-2.5 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none focus:shadow-outline-green transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
                  placeholder="tu@ejemplo.com o tu_usuario"
                  disabled={isLoading || isPendingRedirect}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 ml-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-5 py-2.5 pr-12 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-green-400 focus:border-green-500 focus:outline-none transition-all duration-300 ease-in-out shadow-sm hover:shadow-inner"
                    placeholder="********"
                    disabled={isLoading || isPendingRedirect}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-600 hover:text-green-800"
                    disabled={isLoading || isPendingRedirect}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Enlace para recuperar contraseña */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-green-600 hover:text-green-800 transition-colors"
                  disabled={isLoading || isPendingRedirect}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className='flex justify-center'>
                <button
                  type="submit"
                  disabled={isLoading || isPendingRedirect}
                  className={`w-full font-semibold text-white font-medium text-sm px-5 py-2.5 text-center me-2 mb-2 rounded-full transition duration-300 ease-in-out
                    ${(isLoading || isPendingRedirect)
                      ? 'bg-green-400 cursor-not-allowed'
                      : 'bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
                    }`}
                >
                  {isPendingRedirect 
                    ? 'Redirigiendo...' 
                    : isLoading 
                      ? 'Iniciando Sesión...' 
                      : 'Iniciar Sesión'
                  }
                </button>
              </div>
            </form>
          )}

          {/* Formulario de Recuperación de Contraseña */}
          {showForgotPassword && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center text-gray-600 text-sm mb-4">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </div>

              <div>
                <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-1 ml-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="forgotEmail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="w-full px-5 py-2.5 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none focus:shadow-outline-green transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
                  placeholder="tu@ejemplo.com"
                  disabled={isSendingReset}
                />
              </div>

              <div className='flex justify-center'>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className={`w-full font-semibold text-white font-medium text-sm px-5 py-2.5 text-center me-2 mb-2 rounded-full transition duration-300 ease-in-out
                    ${isSendingReset
                      ? 'bg-green-400 cursor-not-allowed'
                      : 'bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
                    }`}
                >
                  {isSendingReset ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginModal;