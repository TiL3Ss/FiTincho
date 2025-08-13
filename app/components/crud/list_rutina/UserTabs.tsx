'use client';

import React, { useState } from 'react';
import WeekTabs from './WeekTabs';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

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

interface GroupedRoutines {
  [userId: string]: {
    user: User;
    weeks: {
      [weekNumber: number]: {
        [dayName: string]: Routine[];
      };
    };
  };
}

interface UserTabsProps {
  groupedRoutines: GroupedRoutines;
  onEdit: (routine: Routine) => void;
  onDelete: (id: number) => void;
  onAddRoutine: () => void;  
}

const UserTabs: React.FC<UserTabsProps> = ({ groupedRoutines, onEdit, onDelete, onAddRoutine }) => {
  const users = Object.values(groupedRoutines);
  const [activeUser, setActiveUser] = useState(users[0]?.user.id);

  if (!users.length) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-2 text-gray-700 shadow-lg border border-white/40 max-w-5xl mx-auto">
      <div className="flex items-center border-b border-gray-300 overflow-x-auto whitespace-nowrap rounded-t-2xl">
        <div className="flex space-x-1 flex-grow">
          {users.map(({ user }) => (
            <button
              key={user.id}
              onClick={() => setActiveUser(user.id)}
              className={`
                py-3 px-7 font-semibold transition-colors duration-300 text-sm rounded-t-2xl
                ${
                  activeUser === user.id
                    ? 'border-b-4 border-green-700 text-green-900 bg-gray-300/60 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }
              `}
            >
              {`${user.first_name} ${user.last_name}`}
            </button>
          ))}
        </div>
        
      </div>
          
      <div className="mt-8">
        {activeUser && groupedRoutines[activeUser] && (
          <WeekTabs weeks={groupedRoutines[activeUser].weeks} onEdit={onEdit} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
};

export default UserTabs;
