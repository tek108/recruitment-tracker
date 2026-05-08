import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const nav = [
  { to: '/',            label: 'Daily Digest',  icon: '🏠' },
  { to: '/roles',       label: 'Roles',         icon: '💼' },
  { to: '/talent-pool', label: 'Talent Pool',   icon: '⭐' },
  { to: '/search',      label: 'Search',        icon: '🔍' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-52 flex-shrink-0 bg-gray-900 flex flex-col h-full">
      <div
        className="px-5 py-5 border-b border-gray-700 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <h1 className="text-white font-bold text-lg leading-tight">Recruitment</h1>
        <p className="text-gray-400 text-sm">Tracker</p>
      </div>

      <nav className="flex-1 py-4">
        {nav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs">Local · Single user</p>
      </div>
    </aside>
  );
}
