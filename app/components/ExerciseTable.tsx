// components/ExerciseTable.tsx
import { FC, useState } from 'react';
import { ExerciseData } from '../types';
import ProgressBar from './ProgressBar';

interface ExerciseTableProps {
  data: ExerciseData[];
}

const ExerciseTable: FC<ExerciseTableProps> = ({ data }) => {
  const [progressValues, setProgressValues] = useState<{ [key: number]: number }>(
    data.reduce((acc, item) => ({ ...acc, [item.series]: item.progress }), {})
  );

  // Convertir kg a lbs
  const kgToLbs = (kg: number) => Math.round(kg * 2.20462);

  // Calcular el nuevo peso basado en el porcentaje
  const calculateNewWeight = (baseWeight: number, percent: number) => {
    return baseWeight + (baseWeight * percent / 100);
  };

  const handleProgressChange = (series: number, percentage: number) => {
    setProgressValues(prev => ({
      ...prev,
      [series]: percentage
    }));
  };

  return (
    <div className="flex-1 bg-white rounded-r-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50/50 border-b border-gray-100 text-xs font-medium text-gray-600 uppercase tracking-wide">
        <div className="text-center">Serie</div>
        <div className="text-center">Peso</div>
        <div className="text-center">Reps</div>
        <div className="text-center">Descanso</div>
        <div className="text-center">Progreso</div>
        <div className="text-center">Ajuste</div>
      </div>

      {/* Rows */}
      {data.map((item, index) => (
        <div 
          key={index} 
          className="grid grid-cols-6 gap-2 p-4 items-center hover:bg-gray-50/50 transition-colors duration-200 border-b border-gray-50 last:border-b-0"
        >
          {/* Serie */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {item.series}
            </div>
          </div>
          
          {/* Peso */}
          <div className="text-center">
            <div className="text-gray-900 font-semibold text-base">{item.weight}kg</div>
            <div className="text-gray-500 text-xs">{kgToLbs(item.weight)}lbs</div>
          </div>
          
          {/* Repeticiones */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
              {item.reps}
            </div>
          </div>
          
          {/* Descanso */}
          <div className="text-center">
            <div className="text-purple-700 font-medium text-sm">{item.rest}</div>
          </div>
          
          {/* Progreso actual */}
          <div className="text-center">
            <div className={`font-bold text-base ${
              progressValues[item.series] > 0 
                ? 'text-green-600' 
                : progressValues[item.series] < 0 
                  ? 'text-red-600' 
                  : 'text-gray-600'
            }`}>
              {progressValues[item.series] > 0 ? '+' : ''}{progressValues[item.series]}%
            </div>
            <div className="text-gray-700 text-sm font-medium">
              {calculateNewWeight(item.weight, progressValues[item.series]).toFixed(1)}kg
            </div>
            <div className="text-gray-500 text-xs">
              {kgToLbs(calculateNewWeight(item.weight, progressValues[item.series]))}lbs
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="px-2">
            <ProgressBar
              currentWeight={item.weight}
              onProgressChange={(percentage) => handleProgressChange(item.series, percentage)}
              initialPercentage={progressValues[item.series]}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExerciseTable;