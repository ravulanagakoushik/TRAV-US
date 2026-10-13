import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Route,
  Zap,
  Truck,
  Package,
  Bot,
  History,
  FileSpreadsheet,
  Settings,
  Sparkles,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: '3D City View', path: '/city', icon: Building2 },
  { name: 'Route Optimization', path: '/optimization', icon: Route },
  { name: 'Disruption Simulator', path: '/simulator', icon: Zap },
  { name: 'Fleet Vehicles', path: '/vehicles', icon: Truck },
  { name: 'Delivery Stops', path: '/deliveries', icon: Package },
  { name: 'AI Mobility Advisor', path: '/advisor', icon: Bot },
  { name: 'History & Runs', path: '/history', icon: History },
  { name: 'Reports & Export', path: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#382416] text-[#F3E8D7] flex flex-col shrink-0 min-h-screen border-r border-[#5B3925]">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#5B3925]/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#A66B38] to-[#D4A373] flex items-center justify-center shadow-lg text-[#382416]">
          <Sparkles className="w-6 h-6 text-[#FFF9F0]" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#FFF9F0] flex items-center gap-1.5">
            RouteRescue <span className="text-xs bg-[#A66B38] text-white px-1.5 py-0.5 rounded font-mono">AI</span>
          </h1>
          <p className="text-[11px] text-[#C4AC94]">Smart Mobility & Fleet Platform</p>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-[#A68A72] uppercase">
          Operations Hub
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#5B3925] text-[#FFF9F0] shadow-sm border-l-4 border-[#D4A373]'
                  : 'text-[#E2D1BC] hover:bg-[#5B3925]/40 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0 text-[#D4A373]" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-4 border-t border-[#5B3925]/50 space-y-3">
        <div className="bg-[#2B1B10] p-3 rounded-lg border border-[#5B3925]">
          <div className="flex items-center gap-2 text-[#E2D1BC] font-semibold text-xs mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Dispatch Engine Live
          </div>
          <p className="text-[11px] text-[#A68A72]">
            Deterministic heuristic optimizer + Gemini intelligence.
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('routerescue_token');
            localStorage.removeItem('routerescue_user_email');
            window.location.href = '/login';
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#5B3925]/60 hover:bg-[#B71C1C] text-[#E2D1BC] hover:text-white text-xs font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
