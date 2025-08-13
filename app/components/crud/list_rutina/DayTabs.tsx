'use client';

import React, { useState } from 'react';
import RoutineDetails from './RoutineDetails';

interface Routine {
  id: number;
  week_number: number;
  day_name: string;
  is_active: number;
  username: string;
  muscle_groups: any[];
  exercises: any[];
  created_at: string;
}

interface DayTabsProps {
  days: {
    [dayName: string]: Routine[];
  };
  onEdit: (routine: Routine) => void;
  onDelete: (id: number) => void;
}

const DayTabs: React.FC<DayTabsProps> = ({ days, onEdit, onDelete }) => {
  const dayNames = Object.keys(days);
  const [activeDay, setActiveDay] = useState(dayNames[0]);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-2 mt-6 shadow-md border border-white/40">
      <div className="flex border-b border-gray-100 rounded-t-2xl overflow-x-auto whitespace-nowrap">
        {dayNames.map((dayName) => (
          <button
            key={dayName}
            onClick={() => setActiveDay(dayName)}
            className={`
              py-3 px-6 font-semibold transition-colors duration-300 text-sm rounded-t-2xl
              ${
                activeDay === dayName
                  ? 'border-b-4 border-emerald-200 text-emerald-400 bg-gray-200/60 shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
              }
            `}
          >
            {dayName}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {activeDay && days[activeDay] && days[activeDay].map((routine) => (
          <RoutineDetails
            key={routine.id}
            routine={routine}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default DayTabs;
