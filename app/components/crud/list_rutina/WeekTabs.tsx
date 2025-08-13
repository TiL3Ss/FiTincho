'use client';

import React, { useState } from 'react';
import DayTabs from './DayTabs';

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

interface WeekTabsProps {
  weeks: {
    [weekNumber: number]: {
      [dayName: string]: Routine[];
    };
  };
  onEdit: (routine: Routine) => void;
  onDelete: (id: number) => void;
}

const WeekTabs: React.FC<WeekTabsProps> = ({ weeks, onEdit, onDelete }) => {
  const weekNumbers = Object.keys(weeks).sort((a, b) => parseInt(a) - parseInt(b));
  const [activeWeek, setActiveWeek] = useState(weekNumbers[0]);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-2 shadow-md border border-white/40">
      <div className="flex border-b border-gray-100 rounded-t-2xl">
        {weekNumbers.map((weekNumber) => (
          <button
            key={weekNumber}
            onClick={() => setActiveWeek(weekNumber)}
            className={`
              py-3 px-6 font-semibold transition-colors duration-300 text-sm rounded-t-2xl
              ${
                activeWeek === weekNumber
                  ? 'border-b-4 border-green-400 text-green-600 bg-gray-200/60 shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
              }
            `}
          >
            Semana {weekNumber}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeWeek && weeks[parseInt(activeWeek)] && (
          <DayTabs days={weeks[parseInt(activeWeek)]} onEdit={onEdit} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
};

export default WeekTabs;
