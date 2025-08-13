// app/page.tsx
'use client'

import { useState, useEffect } from 'react';
import Head from 'next/head';
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
    // Puedes añadir un loader aquí si quieres
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <FichaCompleta />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gray-900">
      <Head>
        <title>FiTincho</title>
        <meta name="description" content="Organiza tus rutinas" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={() => setShowRegisterModal(true)}
        isLoggedIn={isLoggedIn}
        username={username} 
        onLogout={handleLogout}
        className="relative z-20"
      />

      <main className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center relative z-20">
        <h1 className="text-5xl font-bold text-white mb-6">
          Domina tu entrenamiento como nunca antes
        </h1>
        <p className="text-xl text-gray-200 mb-8 max-w-2xl">
          Controla tus rutinas de ejercicio al detalle: registra lo que completaste, sigue tu progreso actual y planifica tus próximos entrenamientos. Nunca pierdas el ritmo de tu evolución física.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="bg-gradient-to-b from-green-600 to-green-700 text-white px-6 py-2.5 rounded-full text-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg transform"
          >
            Regístrate Ahora
          </button>
          <button
            onClick={() => setShowLoginModal(true)}
            className="border-2 border-green-200 text-green-200 px-5 py-2 rounded-full text-base font-semibold hover:bg-green-900/10 hover:border-green-100 hover:text-green-100 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Ya tengo cuenta
          </button>
        </div>
      </main>

      {/* Modal de Login */}
      {showLoginModal && (
        <LoginModal
          onClose={handleCloseLoginModal}
          onSuccess={handleLoginSuccess}
          isPendingRedirect={pendingProfileRedirect}
        />
      )}

      {/* Modal de Registro */}
      {showRegisterModal && (
        <RegisterModal
          onClose={handleCloseRegisterModal}
          onSuccess={handleRegisterSuccess}
          isPendingRedirect={pendingLoginRedirect}
        />
      )}

      {/* Modal de Reset de Contraseña */}
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