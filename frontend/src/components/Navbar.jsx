import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 mb-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">2FA Vault</div>
        <div className="flex items-center">
            <span className="text-gray-300 mr-4">{user?.email}</span>
            <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Logout
            </button>
        </div>
      </div>
    </nav>
  );
}
