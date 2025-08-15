// app/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import ResetPasswordModal from './components/reset-password';
import { useSession, signOut } from 'next-auth/react';
import FichaCompleta from './ficha_completa/page';


export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [pendingLoginRedirect, setPendingLoginRedirect] = useState(false);
  const [pendingProfileRedirect, setPendingProfileRedirect] = useState(false);

  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const isLoadingSession = status === 'loading';
  const isLoggedIn = status === 'authenticated';

  const username = session?.user?.name || session?.user?.email || null; 

  // Detectar token de reset en la URL
  useEffect(() => {
    const token = searchParams.get('token');
    const resetParam = searchParams.get('reset');
    
    // Si hay un token y viene de un enlace de reset
    if (token && (resetParam === 'password' || window.location.pathname.includes('reset'))) {
      setResetToken(token);
      setShowResetModal(true);
      
      // Limpiar otros modales si están abiertos
      setShowLoginModal(false);
      setShowRegisterModal(false);
    }
  }, [searchParams]);

  const handleLoginSuccess = () => {
    setPendingProfileRedirect(true);
    
    setTimeout(() => {
      setShowLoginModal(false);
      setPendingProfileRedirect(false);
    }, 3000); // 3 segundos para que se vea la notificación
  };

  const handleRegisterSuccess = () => {
    setPendingLoginRedirect(true);
    
    setTimeout(() => {
      setShowRegisterModal(false);
      setPendingLoginRedirect(false);
      setShowLoginModal(true);
    }, 3000); // 3 segundos para que se vea la notificación
  };

  const handleResetSuccess = () => {
    console.log('Contraseña restablecida exitosamente');
    // El modal se cerrará automáticamente después de mostrar el éxito
    // Podrías añadir lógica adicional aquí como abrir el modal de login
    setTimeout(() => {
      setShowLoginModal(true);
    }, 3500); // Abrir login después de que se cierre el modal de reset
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/page' });
  };

  // Función para cerrar el modal de login
  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setPendingProfileRedirect(false); // Resetear el estado si se cierra manualmente
  };

  // Función para cerrar el modal de registro
  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
    setPendingLoginRedirect(false); // Resetear el estado si se cierra manualmente
  };

  // Función para cerrar el modal de reset
  const handleCloseResetModal = () => {
    setShowResetModal(false);
    setResetToken(null);
    
    // Limpiar parámetros de URL sin recargar la página
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('reset');
    window.history.replaceState({}, '', url.toString());
  };

  // Función para abrir el modal de reset programáticamente (opcional)
  const handleOpenResetModal = (token: string) => {
    setResetToken(token);
    setShowResetModal(true);
    
    // Cerrar otros modales
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Fondo Lumiflex */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-900 to-sky-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(72,187,120,0.3),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.25),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(45,212,191,0.2),_transparent_50%)]" />
          <div className="absolute inset-0 opacity-40 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)]" 
               style={{ backgroundSize: '20px 20px' }} />
        </div>
        
        {/* Loader con estilo iOS 18 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
          <p className="text-white/70 text-sm mt-4 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <FichaCompleta />;
  }

  return (
  <div className="min-h-screen flex flex-col relative overflow-hidden">
    

    {/* Fondo celeste-verde */}
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-sky-900">
      {/* Gradientes radiales */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(72,187,120,0.3),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.25),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(45,212,191,0.2),_transparent_50%)]" />
      
      {/* Overlay textura */}
      <div
        className="absolute inset-0 opacity-40 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.15)_50%,transparent_75%,transparent_100%)]"
        style={{ backgroundSize: '20px 20px' }}
      />

      {/* Elementos flotantes animados */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-emerald-300/10 to-teal-300/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-3/4 right-1/4 w-40 h-40 bg-gradient-to-r from-sky-300/10 to-cyan-300/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-green-300/10 to-emerald-300/10 rounded-full blur-xl animate-pulse delay-2000"></div>
    </div>

    <Header
      onLoginClick={() => setShowLoginModal(true)}
      onRegisterClick={() => setShowRegisterModal(true)}
      isLoggedIn={isLoggedIn}
      username={username}
      onLogout={handleLogout}
      className="relative z-20 backdrop-blur-md bg-white/5 border-b border-white/10"
    />

    <main className="flex-grow container mx-auto px-6 py-20 flex flex-col items-center justify-center text-center relative z-20">
      {/* Contenedor principal */}
      <div className="max-w-4xl mx-auto backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-12 shadow-2xl">
        {/* Badge superior */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-sky-500/20 border border-green-400/20 mb-8">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm font-medium text-white/90">Plataforma de Entrenamiento</span>
        </div>

        {/* Título */}
        <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent mb-6 leading-tight">
          Domina tu
          <span className="block bg-gradient-to-r from-green-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
            entrenamiento
          </span>
          como nunca antes
        </h1>

        {/* Subtítulo */}
        <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          Controla tus rutinas de ejercicio al detalle: registra lo que completaste, sigue tu progreso actual y planifica tus próximos entrenamientos. Nunca pierdas el ritmo de tu evolución física.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-sky-500 hover:from-green-400 hover:to-sky-400 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[200px]"
          >
            <span className="relative z-10">Regístrate Ahora</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          <button
            onClick={() => setShowLoginModal(true)}
            className="group backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[200px]"
          >
            Ya tengo cuenta
          </button>
        </div>

        {/* Indicadores */}
        <div className="flex flex-wrap justify-center gap-6 mt-16 pt-8 border-t border-white/10">
          <div className="flex items-center text-white/60 text-sm font-medium">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Seguimiento en tiempo real
          </div>
          <div className="flex items-center text-white/60 text-sm font-medium">
            <div className="w-2 h-2 bg-sky-400 rounded-full mr-2"></div>
            Rutinas personalizadas
          </div>
          <div className="flex items-center text-white/60 text-sm font-medium">
            <div className="w-2 h-2 bg-teal-400 rounded-full mr-2"></div>
            Análisis de progreso
          </div>
        </div>
      </div>
    </main>

    {/* Modales */}
    {showLoginModal && (
      <LoginModal
        onClose={handleCloseLoginModal}
        onSuccess={handleLoginSuccess}
        isPendingRedirect={pendingProfileRedirect}
      />
    )}
    {showRegisterModal && (
      <RegisterModal
        onClose={handleCloseRegisterModal}
        onSuccess={handleRegisterSuccess}
        isPendingRedirect={pendingLoginRedirect}
      />
    )}
    {showResetModal && resetToken && (
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={handleCloseResetModal}
        token={resetToken}
        onSuccess={handleResetSuccess}
      />
    )}
  </div>
);

}