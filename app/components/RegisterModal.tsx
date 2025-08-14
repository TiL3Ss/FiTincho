// app/components/RegisterModal.tsx
'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import NotificationToast from './NotificationToast';

interface RegisterModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  isPendingRedirect?: boolean;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSuccess, isPendingRedirect = false }) => {
  // Estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Notificación
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hideNotification();
    setIsLoading(true);

    // Validaciones básicas
    if (!username.trim() || !email.trim() || !password.trim()) {
      showNotification('Por favor, completa los campos obligatorios.', 'warning');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showNotification('Las contraseñas no coinciden.', 'error');
      setIsLoading(false);
      return;
    }

    // Validación opcional del teléfono
    if (phone && !phone.startsWith('+')) {
      showNotification('El teléfono debe comenzar con + seguido del código de país.', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          phone: phone || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('¡Registro exitoso! Serás redirigido al login en unos segundos...', 'success');
        if (onSuccess) onSuccess();
      } else {
        showNotification(data.message || 'Error al registrar el usuario.', 'error');
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      showNotification('Error de conexión. Inténtalo de nuevo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <>
    {notification.show && (
      <NotificationToast
        message={notification.message}
        type={notification.type}
        duration={4000}
        onClose={hideNotification}
        persistent={notification.type === 'error' || isPendingRedirect}
      />
    )}

    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/30 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl max-w-md w-full relative mx-4">
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-sky-400 bg-clip-text text-transparent">
          Registrarse
        </h2>

        <button
          onClick={onClose}
          disabled={isPendingRedirect}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center text-xl font-semibold transition-all duration-300 ${
            isPendingRedirect 
              ? 'text-white/40 cursor-not-allowed' 
              : 'text-white/80 hover:text-white hover:bg-red-500/20 hover:scale-105'
          }`}
          aria-label="Cerrar"
        >
          ×
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de Usuario */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2 ml-1">
              Nombre de Usuario *
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-5 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:outline-none transition-all duration-300 shadow-sm hover:bg-white/15"
              placeholder="Tu nombre de usuario"
              disabled={isLoading || isPendingRedirect}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2 ml-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:outline-none transition-all duration-300 shadow-sm hover:bg-white/15"
              placeholder="tu@ejemplo.com"
              disabled={isLoading || isPendingRedirect}
            />
          </div>

          {/* Nombre y Apellido */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-2 ml-1">
                Nombre
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-5 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:outline-none transition-all duration-300 shadow-sm hover:bg-white/15"
                placeholder="Tu nombre"
                disabled={isLoading || isPendingRedirect}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-2 ml-1">
                Apellido
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-5 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:outline-none transition-all duration-300 shadow-sm hover:bg-white/15"
                placeholder="Tu apellido"
                disabled={isLoading || isPendingRedirect}
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2 ml-1">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-5 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:outline-none transition-all duration-300 shadow-sm hover:bg-white/15"
              placeholder="+56 9 0000 0000"
              disabled={isLoading || isPendingRedirect}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2 ml-1">
              Contraseña *
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

          {/* Confirmar Contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2 ml-1">
              Confirmar Contraseña *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-5 py-3 pr-12 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:outline-none transition-all duration-300 shadow-sm hover:bg-white/15"
                placeholder="********"
                disabled={isLoading || isPendingRedirect}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-400 hover:text-emerald-300 transition-colors"
                disabled={isLoading || isPendingRedirect}
              >
                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Botón de Envío */}
          <div className='flex justify-center pt-4'>
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
                    ? 'Registrando...' 
                    : 'Registrarse'
                }
              </span>
              {!isLoading && !isPendingRedirect && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </>
);
};

export default RegisterModal;