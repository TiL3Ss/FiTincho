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
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/30 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl max-w-md w-full relative mx-4">
        {/* Título dinámico */}
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-sky-400 bg-clip-text text-transparent">
          {showForgotPassword ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
        </h2>
        
        {/* Botón para cerrar el modal */}
        <button
          onClick={onClose}
          disabled={isPendingRedirect}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center text-xl font-semibold transition-all duration-300 ${
            isPendingRedirect 
              ? 'text-white/40 cursor-not-allowed' 
              : 'text-white/80 hover:text-white hover:bg-white/20 hover:scale-105'
          }`}
          aria-label="Cerrar"
        >
          ×
        </button>

        {/* Botón para volver al login (solo visible en forgot password) */}
        {showForgotPassword && (
          <button
            onClick={handleBackToLogin}
            disabled={isSendingReset}
            className="absolute top-4 left-4 w-8 h-8 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
            aria-label="Volver al login"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        )}

        {/* Formulario de Login */}
        {!showForgotPassword && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-white/80 mb-2 ml-1">
                Correo Electrónico o Nombre de Usuario
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-5 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:outline-none transition-all duration-300 shadow-sm hover:bg-white/15"
                placeholder="tu@ejemplo.com o tu_usuario"
                disabled={isLoading || isPendingRedirect}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-5 py-3 pr-12 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:outline-none transition-all duration-300 shadow-sm hover:bg-white/15"
                  placeholder="********"
                  disabled={isLoading || isPendingRedirect}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-400 hover:text-emerald-300 transition-colors"
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
                className="text-sm text-teal-300 hover:text-teal-200 transition-colors font-medium"
                disabled={isLoading || isPendingRedirect}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div className='flex justify-center pt-2'>
              <button
                type="submit"
                disabled={isLoading || isPendingRedirect}
                className={`group w-full font-semibold text-white px-6 py-3.5 text-center rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden relative
                  ${(isLoading || isPendingRedirect)
                    ? 'bg-gradient-to-r from-emerald-400/50 to-sky-400/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400'
                  }`}
              >
                <span className="relative z-10">
                  {isPendingRedirect 
                    ? 'Redirigiendo...' 
                    : isLoading 
                      ? 'Iniciando Sesión...' 
                      : 'Iniciar Sesión'
                  }
                </span>
                {!isLoading && !isPendingRedirect && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Formulario de Recuperación de Contraseña */}
        {showForgotPassword && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="text-center text-white/70 text-sm mb-6 leading-relaxed">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </div>

            <div>
              <label htmlFor="forgotEmail" className="block text-sm font-medium text-white/80 mb-2 ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="forgotEmail"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="w-full px-5 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:outline-none transition-all duration-300 shadow-sm hover:bg-white/15"
                placeholder="tu@ejemplo.com"
                disabled={isSendingReset}
              />
            </div>

            <div className='flex justify-center pt-2'>
              <button
                type="submit"
                disabled={isSendingReset}
                className={`group w-full font-semibold text-white px-6 py-3.5 text-center rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden relative
                  ${isSendingReset
                    ? 'bg-gradient-to-r from-emerald-400/50 to-sky-400/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400'
                  }`}
              >
                <span className="relative z-10">
                  {isSendingReset ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                </span>
                {!isSendingReset && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                )}
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