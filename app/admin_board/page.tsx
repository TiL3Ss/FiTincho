// app/admin_board/page.tsx
'use client';

import Head from 'next/head'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import SelectModal from '../components/SelectModal';
import UsersCrud from '../components/crud/list_rutina/UsersCrud';
import RoutinesCrud from '../components/crud/RoutinesCrud';
import ExercisesCrud from '../components/crud/ExercisesCrud';
import RoutineUploader from '../components/crud/RoutineUploader';
import RoutinesBackUp from '../components/crud/RoutinesBackUp';
import NotificationToast from '../components/NotificationToast';
import { useProfile } from '../hooks/useProfile';

export type TableType = 'users' | 'routines'  | 'exercises' | 'RoutineUploader' | 'RoutinesBackUp';




export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function AdminBoard() {
  const router = useRouter();
  const { 
    profileUser, 
    isOwnProfile, 
    isLoading: profileLoading, 
    error: profileError,
    displayName,
    isAuthenticated,
    sessionStatus,
    isModerator
  } = useProfile();

  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });
  const [redirecting, setRedirecting] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  // Handlers del Header
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

  // Función para mostrar notificaciones
  const showNotification = (message: string, type: NotificationState['type']) => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Verificación adicional de permisos con la API
  const verifyAdminPermissions = async () => {
    try {
      const response = await fetch('/api/admin/check');
      const data = await response.json();
      
      if (!response.ok || !data.isAdmin) {
        console.log('Verificación de permisos falló:', data.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando permisos de admin:', error);
      return false;
    }
  };

  // Verificar permisos y redireccionar si es necesario
  useEffect(() => {
    const checkPermissions = async () => {
      // Solo verificar cuando los datos estén completamente cargados
      if (profileLoading || sessionStatus === 'loading') {
        return;
      }

      // Primera verificación: autenticación
      if (!isAuthenticated) {
        console.log('Usuario no autenticado, redirigiendo a login');
        setRedirecting(true);
        showNotification('Debes iniciar sesión para acceder al panel de administración', 'warning');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      // Segunda verificación: permisos de moderador desde el perfil
      if (isAuthenticated && isModerator === false) {
        console.log('Usuario no es moderador según perfil, redirigiendo');
        setRedirecting(true);
        showNotification('No tienes permisos de administrador', 'error');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      // Tercera verificación: doble check con la API
      if (isAuthenticated && isModerator && !permissionChecked) {
        const hasAdminPermissions = await verifyAdminPermissions();
        
        if (!hasAdminPermissions) {
          console.log('Verificación adicional de permisos falló');
          setRedirecting(true);
          showNotification('Permisos de administrador no válidos', 'error');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        setPermissionChecked(true);
        console.log('Todas las verificaciones de permisos exitosas');
        setRedirecting(false);
      }
    };

    checkPermissions();
  }, [isAuthenticated, isModerator, profileLoading, sessionStatus, permissionChecked, router]);

  // Loading state
  if (profileLoading || sessionStatus === 'loading' || (!permissionChecked && isAuthenticated)) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">
            {!permissionChecked ? 'Verificando permisos...' : 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-white to-pink-50 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-red-200/50">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 text-lg mb-6 font-medium">{profileError}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Estado de redirección - mostrar mientras se procesa la redirección
  if (redirecting) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500/30 border-t-orange-500 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">
            {!isAuthenticated ? 'Redirigiendo al login...' : 'Acceso no autorizado. Redirigiendo...'}
          </p>
        </div>
      </div>
    );
  }

  // Verificación final antes de renderizar - solo si no estamos cargando y no estamos redirigiendo
  if (!profileLoading && sessionStatus !== 'loading' && !redirecting && permissionChecked) {
    if (!isAuthenticated || !isModerator) {
      return (
        <div className="bg-gradient-to-br from-red-50 via-white to-pink-50 min-h-screen flex items-center justify-center">
          <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-red-200/50">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
            <p className="text-red-600 text-lg mb-6 font-medium">
              {!isAuthenticated 
                ? 'No tienes acceso. Inicia sesión primero.' 
                : 'No tienes permisos para acceder al panel de administración.'
              }
            </p>
            <div className="space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Volver al inicio
              </button>
              {!isAuthenticated && (
                <button 
                  onClick={() => router.push('/login')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  const renderCrudComponent = () => {
    if (!selectedTable) return null;

    const commonProps = {
      showNotification,
      onClose: () => setSelectedTable(null)
    };

    switch (selectedTable) {
      case 'users':
        return <UsersCrud {...commonProps} />;
      case 'routines':
        return <RoutinesCrud {...commonProps} />;
     
      case 'exercises':
        return <ExercisesCrud {...commonProps} />;
      case 'RoutineUploader':
      return (
        <RoutineUploader 
          {...commonProps} 
          selectedUserId={profileUser?.id}
        /> );
      case 'RoutinesBackUp':
        return <RoutinesBackUp {...commonProps} />;
      default:
        return null;
    }
  };

  

  return (
    <>
    
      <Head>
        <title>Panel de Administración - FitWW</title>
        <meta name="description" content="Panel de administración para gestionar usuarios, rutinas y ejercicios en FitWW." />
      </Head>
    <div className="bg-gradient-to-br from-emerald-200 via-emerald-500/30 to-emerald-300/30 min-h-screen flex flex-col">
      {/* Header */}
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

      {/* Badge de administrador */}
      {isModerator && (
        <div className="mx-6 mt-2">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg w-fit">
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Panel de Administración
            </span>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 p-6">
        {!selectedTable ? (
          // Mostrar SelectModal cuando no hay tabla seleccionada
          <SelectModal onSelectTable={setSelectedTable} />
        ) : (
          // Mostrar el componente CRUD correspondiente
          <div className="backdrop-blur-sm rounded-3xl shadow-2xl p-6 h-full">
            {renderCrudComponent()}
          </div>
        )}
      </div>

      {/* Notificaciones */}
      {notification.show && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
          duration={4000}
        />
      )}
    </div>
   </>
  );
}