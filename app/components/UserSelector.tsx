// components/UserSelector.tsx
import { UserIcon as UserIconS } from '@heroicons/react/24/solid';
import { FC } from 'react';
import { User } from '../types';

type UserSelectorProps = {
  users: User[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
};

const UserSelector: FC<UserSelectorProps> = ({ users, selectedUserId, onSelectUser }) => {
  return (
    <div className="w-full bg-gray-200/80 backdrop-blur-sm border-b border-white/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          
          <nav className="flex space-x-0">
            {users.map((user, index) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                className={`relative px-6 py-4 text-sm font-medium transition-all duration-300 flex items-center space-x-2 border-b-2 ${
                  user.id === selectedUserId
                    ? 'text-green-600 border-green-500 bg-green-50/50'
                    : 'text-gray-600 border-transparent hover:text-green-500 hover:border-green-300 hover:bg-green-50/30'
                } ${
                  index === 0 ? 'rounded-tl-lg' : ''
                } ${
                  index === users.length - 1 ? 'rounded-tr-lg' : ''
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-200 ${
                  user.id === selectedUserId
                    ? 'bg-green-500 text-white scale-110'
                    : 'bg-gray-300 text-gray-600 group-hover:bg-green-100'
                }`}>
                  <UserIconS className="w-3 h-3" />
                </div>
                <span className="font-semibold">{user.name}</span>
                
                {/* Indicador activo */}
                {user.id === selectedUserId && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};
export default UserSelector;