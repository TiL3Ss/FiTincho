// app/hooks/useResetPassword.tsx
'use client';

import { useState, useCallback } from 'react';

export interface UseResetPasswordReturn {
  isModalOpen: boolean;
  currentToken: string | null;
  openResetModal: (token: string) => void;
  closeResetModal: () => void;
}

/**
 * Hook personalizado para manejar el modal de reset de contraseña
 * @returns Objeto con estados y funciones para controlar el modal
 */
export const useResetPassword = (): UseResetPasswordReturn => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  const openResetModal = useCallback((token: string) => {
    setCurrentToken(token);
    setIsModalOpen(true);
  }, []);

  const closeResetModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentToken(null);
  }, []);

  return {
    isModalOpen,
    currentToken,
    openResetModal,
    closeResetModal,
  };
};