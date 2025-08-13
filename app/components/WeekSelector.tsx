import { FC } from 'react';

type WeekSelectorProps = {
  weeks: number[];
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
};

const WeekSelector: FC<WeekSelectorProps> = ({ weeks, selectedWeek, onSelectWeek }) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/50">
      <div className="flex items-center justify-between p-2">
        <span className="text-sm font-semibold text-gray-700 ml-2 whitespace-nowrap">Semana:</span>
        <div className="flex gap-2 mx-2"> {/* Gap consistente con DaySelector */}
          {weeks.map(week => (
            <button
              key={week}
              onClick={() => onSelectWeek(week)}
              className={`min-w-8 h-8 px-2 rounded-full font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-md ${
                week === selectedWeek 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
              }`}
            >
              {week}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekSelector;