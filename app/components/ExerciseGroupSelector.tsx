// components/ExerciseGroupSelector.tsx
import { FC } from 'react';
import { MuscleGroup } from '../types';

type ExerciseGroupSelectorProps = {
  groups: MuscleGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
};

const ExerciseGroupSelector: FC<ExerciseGroupSelectorProps> = ({ groups, selectedGroupId, onSelectGroup }) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-white/70 backdrop-blur-sm rounded-full p-3 shadow-lg border border-white/50">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-700 mr-2">Grupos:</span>
          <div className="flex space-x-4">
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-between ${
                  group.id === selectedGroupId
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                }`}
              >
                <span>{group.name}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ml-4 ${
                  group.id === selectedGroupId
                    ? 'bg-white text-green-600'
                    : 'bg-gray-600 text-white'
                }`}>
                  {group.frequency}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseGroupSelector;