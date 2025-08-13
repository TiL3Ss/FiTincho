// components/SelectModal.tsx
'use client';

import { TableType } from '../admin_board/page';
import { 
  UserGroupIcon,
  CalendarDaysIcon,
  BoltIcon,
  DocumentArrowUpIcon,
  ArchiveBoxIcon ,

} from '@heroicons/react/24/outline';

interface SelectModalProps {
  onSelectTable: (table: TableType) => void;
}

interface TableOption {
  id: TableType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TableGroup {
  title: string;
  description: string;
  options: TableOption[];
}

const tableGroups: TableGroup[] = [
  {
    title: 'Gestión de Usuarios',
    description: 'Administra los usuarios del sistema',
    options: [
      {
        id: 'users',
        name: 'Usuarios',
        description: 'Gestionar usuarios del sistema',
        icon: UserGroupIcon,
        color: 'from-blue-500 to-blue-600'
      }
    ]
  },
  {
    title: 'Entrenamientos',
    description: 'Gestiona rutinas y ejercicios',
    options: [
      {
        id: 'routines',
        name: 'Rutinas',
        description: 'Administrar rutinas de entrenamiento',
        icon: CalendarDaysIcon,
        color: 'from-green-500 to-green-600'
      },
      {
        id: 'exercises',
        name: 'Ejercicios',
        description: 'Gestionar ejercicios disponibles',
        icon: BoltIcon,
        color: 'from-orange-500 to-orange-600'
      }
    ]
  },
  {
    title: 'Herramientas',
    description: 'Importación y respaldo de datos',
    options: [
      {
        id: 'RoutineUploader',
        name: 'Subir Rutina',
        description: 'Subir Excel a la Plataforma',
        icon: DocumentArrowUpIcon,
        color: 'from-emerald-500 to-green-600'
      },
      {
        id: 'RoutinesBackUp',
        name: 'Respaldo de Rutinas',
        description: 'Almacenamiento de rutinas',
        icon: ArchiveBoxIcon,
        color: 'from-red-500 to-red-600'
      }
    ]
  }
];

export default function SelectModal({ onSelectTable }: SelectModalProps) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Título principal */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Panel de Administración
        </h1>
        <p className="text-white/70">
          Selecciona una sección para administrar sus datos
        </p>
      </div>

      {/* Grupos de opciones */}
      <div className="space-y-10">
        {tableGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-5">
            {/* Título del grupo */}
            <div className="text-left px-1">
              <h2 className="text-xl font-semibold text-white/95 mb-1">
                {group.title}
              </h2>
              <p className="text-white/55 text-sm font-medium">
                {group.description}
              </p>
            </div>

            {/* Grid de opciones del grupo */}
            <div className={`grid gap-4 ${
              group.options.length === 1 
                ? 'grid-cols-1 max-w-sm' 
                : group.options.length === 2 
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {group.options.map((option) => {
                const IconComponent = option.icon;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => onSelectTable(option.id)}
                    className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-500 ease-out transform hover:scale-[1.03] hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-white/20 text-left active:scale-[0.98] shadow-lg hover:shadow-2xl"
                  >
                    {/* Fondo con efecto glassmorphism mejorado */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Contenido */}
                    <div className="relative flex items-center space-x-5">
                      {/* Icono con estilo iOS */}
                      <div className={`w-14 h-14 bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-500 ease-out shadow-lg group-hover:shadow-xl`}>
                        <IconComponent className="h-7 w-7 text-white drop-shadow-sm" />
                      </div>

                      {/* Contenido de texto */}
                      <div className="flex-1 min-w-0">
                        {/* Título */}
                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-white/95 transition-colors duration-300">
                          {option.name}
                        </h3>

                        {/* Descripción */}
                        <p className="text-white/65 text-sm leading-relaxed font-medium">
                          {option.description}
                        </p>
                      </div>

                      {/* Indicador de hover estilo iOS */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 translate-x-2 group-hover:translate-x-0">
                        <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                          <svg className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Efecto de brillo sutil en hover estilo iOS */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    {/* Borde interno sutil */}
                    <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}