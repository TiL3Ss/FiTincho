'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { WrenchScrewdriverIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  username?: string;
  userProfile?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  isOwnProfile?: boolean;
  isModerator?: boolean;
}

export default function Header({
  onLoginClick,
  onRegisterClick,
  isLoggedIn,
  onLogout,
  username,
  userProfile,
  isOwnProfile = true,
  isModerator = false
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogoutClick = async () => {
    try {
      await onLogout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsDropdownOpen(false);
    }
  };

  const getDisplayName = () => {
    if (userProfile) {
      if (userProfile.first_name && userProfile.last_name) {
        return `${userProfile.first_name} ${userProfile.last_name}`;
      }
      if (userProfile.first_name) {
        return userProfile.first_name;
      }
      return userProfile.username;
    }
    return username || 'Usuario';
  };

  const handleProfileClick = () => {
    if (userProfile?.username) {
      router.push(`/profile/${userProfile.username}`);
    } else if (username) {
      router.push(`/profile/${username}`);
    }
    setIsDropdownOpen(false);
  };

  const handleFichaCompletaClick = () => {
    router.push('/ficha_completa');
    setIsDropdownOpen(false);
  };

  const normalizedPath = pathname.replace(/\/$/, '');
  const isInAdminBoard = normalizedPath === '/admin_board';

  const handleAdminIconClick = () => {
    if (isInAdminBoard) {
      router.push('/');
    } else {
      router.push('/admin_board');
    }
  };

  const getAdminIconConfig = () => {
    if (isInAdminBoard) {
      return {
        Icon: CalendarDaysIcon,
        title: 'Volver al Inicio',
        className: 'text-emerald-600 h-5 w-5 transition-all duration-300'
      };
    } else {
      return {
        Icon: WrenchScrewdriverIcon,
        title: 'Panel de Administración',
        className: 'text-emerald-600 h-5 w-5 transition-all duration-300'
      };
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 py-4 px-6 flex justify-between items-center z-50 shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Logo con estilo iOS */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center p-2 overflow-hidden shadow-sm ring-1 ring-emerald-100/50">
          <Image
            src="/images/aaaau.png"
            alt="Logo FT"
            width={500}
            height={500}
            className="object-contain" 
          />
        </div>
        
        {/* Logo text */}
        <Link href="/">
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 cursor-pointer">
            FiTincho
          </span>
        </Link>

        {/* Admin button con estilo iOS */}
        {isModerator && (() => {
          const { Icon, title, className } = getAdminIconConfig();
          return (
            <button
              onClick={handleAdminIconClick}
              title={title}
              className="p-2.5 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-md ring-1 ring-gray-200/30 hover:ring-emerald-200/50 hover:scale-105 active:scale-95"
            >
              <Icon className={className} />
            </button>
          );
        })()}
      </div>

      <nav className="relative">
        {isLoggedIn ? (
          <div className="relative " ref={profileDropdownRef}>
            {/* Profile button estilo iOS */}
            <button
              onClick={toggleDropdown}
              className="relative flex items-center justify-center w-10 h-10 z-[60] rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              aria-label="Menú de perfil"
              aria-expanded={isDropdownOpen}
            >
              <UserCircleIcon className="h-5 w-5" />
            </button>

            {/* Dropdown con glassmorphism */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 -translate-y-[10%] w-64 bg-white/100 backdrop-blur-xl rounded-3xl shadow-2xl py-2 z-40 border border-white/50 ring-1 ring-gray-200/20">

                {/* Header del dropdown */}
                <div className="px-5 py-3 border-b border-gray-200/30">
                  <p className="text-sm font-semibold text-emerald-700">
                    {getDisplayName()}
                  </p>
                  {userProfile?.email && isOwnProfile && (
                    <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">{userProfile.email}</p>
                  )}
                </div>

                {/* Menu items con estilo iOS */}
                <div className="py-2 space-y-1">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200/60 hover:text-gray-900 transition-all duration-200 rounded-2xl w-[calc(100%-1rem)] mx-2">
                  
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center mr-3">
                      <UserCircleIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Ver Perfil</span>
                  </button>

                  <button
                    onClick={handleFichaCompletaClick}
                    className="flex items-center px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200/60 hover:text-gray-900 transition-all duration-200 rounded-2xl w-[calc(100%-1rem)] mx-2">

                  
                    <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span>Mi Rutina</span>
                  </button>
                  {isModerator && (
                  <Link
                    href="/admin_board"
                    className="flex items-center px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200/60 hover:text-gray-900 transition-all duration-200 rounded-2xl w-[calc(100%-1rem)] mx-2"

                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>Panel de Administración</span>
                  </Link>)}

                  {/* Divider */}
                  <div className="border-t border-gray-200/40 my-2 mx-4" />

                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center px-5 py-3 text-sm font-medium text-red-700 hover:bg-red-200/60 hover:text-red-900 transition-all duration-200 rounded-2xl w-[calc(100%-1rem)] mx-2"

                  >
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            {/* Login button estilo iOS */}
            <button
              onClick={onLoginClick}
              className="bg-white/70 backdrop-blur-sm text-gray-700 px-6 py-2.5 rounded-2xl font-semibold border border-gray-200/50 hover:bg-white/90 hover:text-emerald-600 hover:border-emerald-200/50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-500/10"
            >
              Iniciar Sesión
            </button>
            {/* Register button estilo iOS */}
            <button
              onClick={onRegisterClick}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-6 py-2.5 rounded-2xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            >
              Registrarse
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}