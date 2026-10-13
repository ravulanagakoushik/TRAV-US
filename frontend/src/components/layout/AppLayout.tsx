import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#F3E8D7] text-[#382719] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
