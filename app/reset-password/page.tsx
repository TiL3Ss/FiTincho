// app/reset-password/page.tsx
'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Componente principal que usa Suspense
const ResetPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }>
        <ResetPasswordRedirect />
      </Suspense>
    </div>
  );
};

// Componente que redirige a la página principal con el token
const ResetPasswordRedirect: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Redirigir a la página principal con el token y parámetro de reset
      router.push(`/?token=${token}&reset=password`);
    } else {
      // Si no hay token, redirigir al home sin parámetros
      router.push('/');
    }
  }, [token, router]);

  // Contenido de carga mientras redirige
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h1 className="text-3xl font-bold text-green-500 mb-4">
          FiTincho
        </h1>
        <p className="text-gray-300">
          {token ? 'Redirigiendo al formulario de reset...' : 'Redirigiendo...'}
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;