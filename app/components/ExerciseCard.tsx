// components/ExerciseCard.tsx
import { FC } from 'react';
import { Exercise } from '../types';
import ExerciseTable from './ExerciseTable';

type ExerciseCardProps = {
  exercise: Exercise;
};

const ExerciseCard: FC<ExerciseCardProps> = ({ exercise }) => {
  return (
    <div className="flex items-stretch gap-0 mb-8 group transition-all duration-300 ease-in-out hover:shadow-lg">
      {/* Exercise Info Panel */}
      <div className="w-56 p-6 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-l-2xl text-white flex flex-col justify-center shadow-lg relative overflow-hidden">
        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2 leading-tight">{exercise.name}</h3>
          <p className="text-sm opacity-80 leading-relaxed">{exercise.variant}</p>
        </div>
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-4 w-16 h-16 border border-white rounded-full"></div>
          <div className="absolute bottom-4 right-6 w-8 h-8 border border-white rounded-full"></div>
          <div className="absolute top-1/2 right-2 w-4 h-4 bg-white rounded-full transform -translate-y-1/2"></div>
        </div>
      </div>
      
      {/* Table */}
      <ExerciseTable data={exercise.data} />
    </div>
  );
};

export default ExerciseCard;