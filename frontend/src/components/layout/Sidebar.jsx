import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/transacciones', label: '💸 Transacciones' },
  { to: '/categorias', label: '🏷️ Categorías' },
  { to: '/simulador', label: '🛒 Simulador' },
  { to: '/balance', label: '📈 Balance' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-gray-50 border-r border-gray-200 py-6 flex flex-col gap-1">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `px-5 py-2.5 text-sm font-medium rounded-lg mx-2 transition ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}