import { FC } from 'react';

type DaySelectorProps = {
  days: string[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
};

const DaySelector: FC<DaySelectorProps> = ({ days, selectedDay, onSelectDay }) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/50">
      <div className="flex items-center justify-between p-2">
        <span className="text-sm font-semibold text-gray-700 ml-2 whitespace-nowrap">Día:</span>
        <div className="grid grid-cols-7 gap-2 mx-2"> {/* Aumenté el gap a 2 */}
          {days.map(day => (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`w-8 h-8 rounded-full font-bold text-xs transition-all duration-300 transform hover:scale-110 shadow-md ${
                day === selectedDay
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
              }`}
            >
              {day.charAt(0)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DaySelector;