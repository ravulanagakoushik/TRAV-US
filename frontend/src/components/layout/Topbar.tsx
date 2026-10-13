import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { supabase } from '../../services/supabase.js';
import { RefreshCw, Database, Search, User, CheckCircle2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  title?: string;
  onRefresh?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title = 'Operations Overview', onRefresh }) => {
  const [seeding, setSeeding] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem('routerescue_user_email') || 'dispatcher@routerescue.ai';

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await api.seedDemoData();
      setSuccessMessage('Demo fleet initialized with 6 vehicles and 18 stops!');
      setTimeout(() => setSuccessMessage(null), 4000);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to seed demo data', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset demo data to initial factory state?')) return;
    try {
      setSeeding(true);
      await api.resetDemoData();
      setSuccessMessage('Demo fleet state cleanly reset.');
      setTimeout(() => setSuccessMessage(null), 4000);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to reset demo data', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      navigate(`/track/${trackingInput.trim()}`);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        // Continue logout locally
      }
    }
    localStorage.removeItem('routerescue_token');
    localStorage.removeItem('routerescue_user_email');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-[#FFF9F0] border-b border-[#E2D1BC] px-6 flex items-center justify-between shrink-0 shadow-warm-sm z-20">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-[#382719] tracking-tight hover:text-[#5B3925] transition-colors duration-200">
          {title}
        </h2>
        {successMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-full animate-fadeIn shadow-sm hover:scale-105 transition-transform duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Customer Tracking Input with hover and focus scale */}
        <form onSubmit={handleTrackSubmit} className="relative hidden md:block group">
          <input
            type="text"
            placeholder="Track Stop (e.g. TRK-MED-8491)"
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            className="w-52 text-xs bg-[#F3E8D7] border border-[#E2D1BC] text-[#382719] pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B3925] focus:scale-[1.02] focus:bg-white hover:border-[#A66B38] transition-all duration-200 shadow-sm"
          />
          <Search className="w-3.5 h-3.5 text-[#7A624E] absolute left-2.5 top-2.5 group-hover:scale-110 group-hover:text-[#5B3925] transition-transform duration-200" />
        </form>

        {/* Demo Seed Button with hover scale, shadow and icon spin */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="group flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5B3925] text-[#FFF9F0] hover:bg-[#382416] text-xs font-semibold rounded-lg shadow-sm hover:shadow-lg hover:shadow-[#5B3925]/25 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60"
          title="Seed realistic Metro dataset for hackathon judges"
        >
          <Database className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-115 group-hover:-rotate-6" />
          <span>{seeding ? 'Seeding...' : 'Load Sample Data'}</span>
        </button>

        {/* Reset Button with hover scale, border color shift */}
        <button
          onClick={handleReset}
          disabled={seeding}
          className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8D7] text-[#5B3925] hover:bg-[#E2D1BC] hover:border-[#A66B38] text-xs font-semibold rounded-lg border border-[#E2D1BC] shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60"
          title="Reset to default fleet state"
        >
          <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180 ${seeding ? 'animate-spin' : ''}`} />
          <span>Reset</span>
        </button>

        {/* User Info Badge with hover scale */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E2D1BC] group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#E2D1BC] group-hover:bg-[#5B3925] group-hover:text-[#FFF9F0] flex items-center justify-center text-[#5B3925] font-bold text-xs shrink-0 shadow-sm transition-all duration-200 group-hover:scale-110">
            <User className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="hidden lg:block text-left max-w-[130px] truncate">
            <div className="text-xs font-semibold text-[#382719] group-hover:text-[#5B3925] truncate transition-colors duration-200" title={userEmail}>
              {userEmail.split('@')[0]}
            </div>
            <div className="text-[10px] text-[#7A624E]">Operator</div>
          </div>
        </div>

        {/* Logout Button with hover scale, shadow and color change */}
        <button
          onClick={handleLogout}
          className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#FFEBEE] hover:bg-[#B71C1C] text-[#B71C1C] hover:text-[#FFF9F0] border border-[#FFCDD2] hover:border-[#B71C1C] rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          title="Log out of application"
        >
          <LogOut className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
