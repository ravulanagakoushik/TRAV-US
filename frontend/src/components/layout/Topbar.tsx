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
        <h2 className="text-lg font-bold text-[#382719]">{title}</h2>
        {successMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-full animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Customer Tracking Input */}
        <form onSubmit={handleTrackSubmit} className="relative hidden md:block">
          <input
            type="text"
            placeholder="Track Stop (e.g. TRK-MED-8491)"
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            className="w-52 text-xs bg-[#F3E8D7] border border-[#E2D1BC] text-[#382719] pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B3925]"
          />
          <Search className="w-3.5 h-3.5 text-[#7A624E] absolute left-2.5 top-2.5" />
        </form>

        {/* Demo Seed and Reset Buttons */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5B3925] text-[#FFF9F0] hover:bg-[#382416] text-xs font-semibold rounded-lg shadow-sm transition-colors"
          title="Seed realistic Metro dataset for hackathon judges"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{seeding ? 'Seeding...' : 'Load Sample Data'}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8D7] text-[#5B3925] hover:bg-[#E2D1BC] text-xs font-semibold rounded-lg border border-[#E2D1BC] transition-colors"
          title="Reset to default fleet state"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {/* User Info Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E2D1BC]">
          <div className="w-8 h-8 rounded-full bg-[#E2D1BC] flex items-center justify-center text-[#5B3925] font-bold text-xs shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left max-w-[130px] truncate">
            <div className="text-xs font-semibold text-[#382719] truncate" title={userEmail}>
              {userEmail.split('@')[0]}
            </div>
            <div className="text-[10px] text-[#7A624E]">Operator</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#B71C1C] border border-[#FFCDD2] rounded-lg text-xs font-bold transition-all shadow-sm"
          title="Log out of application"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
