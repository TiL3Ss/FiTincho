// components/ui/ColorSelect.tsx
'use client';

import { useState } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ColorOption {
  name: string;
  value: string;
  gradient: string;
}

interface ColorSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Paleta de colores inspirada en iOS 18 con gradientes suaves
const colorOptions: ColorOption[] = [
  { name: 'Coral', value: 'coral', gradient: 'from-orange-400 via-pink-400 to-red-400' },
  { name: 'Océano', value: 'ocean', gradient: 'from-blue-400 via-cyan-400 to-teal-400' },
  { name: 'Bosque', value: 'forest', gradient: 'from-green-400 via-emerald-400 to-teal-500' },
  { name: 'Lavanda', value: 'lavender', gradient: 'from-purple-400 via-violet-400 to-indigo-400' },
  { name: 'Dorado', value: 'golden', gradient: 'from-yellow-400 via-orange-400 to-amber-500' },
  { name: 'Rosa', value: 'rose', gradient: 'from-pink-400 via-rose-400 to-red-400' },
  { name: 'Cielo', value: 'sky', gradient: 'from-sky-400 via-blue-400 to-indigo-400' },
  { name: 'Menta', value: 'mint', gradient: 'from-teal-400 via-green-400 to-emerald-400' },
  { name: 'Sunset', value: 'sunset', gradient: 'from-orange-400 via-red-400 to-pink-500' },
  { name: 'Aurora', value: 'aurora', gradient: 'from-indigo-400 via-purple-400 to-pink-400' },
  { name: 'Esmeralda', value: 'emerald', gradient: 'from-emerald-400 via-green-500 to-teal-500' },
  { name: 'Twilight', value: 'twilight', gradient: 'from-slate-600 via-purple-500 to-indigo-500' }
];

export default function ColorSelect({ value, onChange, className = '' }: ColorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedColor = colorOptions.find(color => color.value === value) || colorOptions[0];

  const handleSelect = (colorValue: string) => {
    onChange(colorValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${selectedColor.gradient} shadow-sm border border-white/20`} />
          <span className="text-gray-700 font-medium">{selectedColor.name}</span>
        </div>
        <ChevronDownIcon 
          className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Menu de colores */}
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
            <div className="pt-3 px-2 pb-2">
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleSelect(color.value)}
                    className={`relative group flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 ${
                      value === color.value ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color.gradient} shadow-md border border-white/30 group-hover:scale-110 transition-transform duration-200`} />
                      {value === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckIcon className="w-4 h-4 text-white drop-shadow-sm" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 mt-1 font-medium">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}