// components/ProgressBar.tsx
import React, { FC, useState, useRef, useCallback } from 'react';

interface ProgressBarProps {
  currentWeight: number;
  onProgressChange: (percentage: number) => void;
  initialPercentage?: number;
}

const ProgressBar: FC<ProgressBarProps> = ({ 
  currentWeight, 
  onProgressChange, 
  initialPercentage = 0 
}) => {
  const [percentage, setPercentage] = useState(initialPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !barRef.current) return;

    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Calcular porcentaje (-50% a +50%)
    let newPercentage = ((x / width) * 100) - 50;
    
    // Limitar entre -50% y +50%
    newPercentage = Math.max(-50, Math.min(50, newPercentage));
    
    setPercentage(Math.round(newPercentage));
    onProgressChange(Math.round(newPercentage));
  }, [isDragging, onProgressChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calcular la posición del punto (0% = centro, -50% = izquierda, +50% = derecha)
  const pointPosition = ((percentage + 50) / 100) * 100;

  return (
    <div className="w-full">
      <div 
        ref={barRef}
        className="relative w-full h-3 bg-gray-200 rounded-full cursor-pointer transition-all duration-200 hover:bg-gray-250"
        onMouseDown={handleMouseDown}
      >
        {/* Línea central (0%) */}
        <div className="absolute left-1/2 top-0 w-px h-full bg-gray-400 transform -translate-x-1/2"></div>
          
        {/* Barra de progreso */}
        <div 
          className={`absolute top-0 bottom-0 rounded-full transition-all duration-200 ${
            percentage >= 0 
              ? 'bg-green-400 left-1/2' 
              : 'bg-red-400 right-1/2'
          }`}
          style={{
            width: `${Math.abs(percentage)}%`
          }}
        ></div>
        
        {/* Punto deslizable */}
        <div 
          className={`absolute top-1/2 w-4 h-4 rounded-full transform -translate-y-1/2 -translate-x-1/2 cursor-grab shadow-sm transition-all duration-200 border-2 border-white ${
            isDragging ? 'cursor-grabbing scale-110 shadow-md' : ''
          } ${
            percentage >= 0 ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{
            left: `${pointPosition}%`
          }}
        ></div>
      </div>
      
      {/* Etiquetas minimalistas */}
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>-50%</span>
        <span>0%</span>
        <span>+50%</span>
      </div>
    </div>
  );
};

export default ProgressBar;