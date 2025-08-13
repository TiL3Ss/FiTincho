// hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  isModerator: boolean;
  createdAt?: string;
}

interface UseProfileReturn {
  profileUser: User | null;
  isOwnProfile: boolean;
  isLoading: boolean;
  error: string | null;
  displayName: string;
  isAuthenticated: boolean;
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  isModerator: boolean; // Agregamos esta propiedad para fácil acceso
  refreshProfile: () => Promise<void>;
}

export function useProfile(userId?: string): UseProfileReturn {
  const { data: session, status: sessionStatus } = useSession();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Si no hay sesión, no hacer la petición
      if (sessionStatus === 'unauthenticated') {
        setProfileUser(null);
        setIsOwnProfile(false);
        return;
      }

      // Si la sesión está cargando, esperar
      if (sessionStatus === 'loading') {
        return;
      }

      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      }

      const response = await fetch(`/api/profile?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar el perfil');
      }

      const data = await response.json();
      setProfileUser(data.user);
      setIsOwnProfile(data.isOwnProfile);

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProfileUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para cargar el perfil cuando cambia la sesión o el userId
  useEffect(() => {
    if (sessionStatus !== 'loading') {
      fetchProfile();
    }
  }, [sessionStatus, userId]);

  // Determinar si está autenticado
  const isAuthenticated = sessionStatus === 'authenticated' && !!session?.user;

  // Determinar si es moderador
  const isModerator = profileUser?.isModerator ?? false;

  // Nombre para mostrar
  const displayName = profileUser?.name || session?.user?.name || 'Usuario';

  return {
    profileUser,
    isOwnProfile,
    isLoading,
    error,
    displayName,
    isAuthenticated,
    sessionStatus,
    isModerator, // Agregamos esta propiedad
    refreshProfile: fetchProfile
  };
}