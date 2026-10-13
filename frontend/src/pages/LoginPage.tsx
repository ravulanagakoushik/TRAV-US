import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('dispatcher@routerescue.ai');
  const [password, setPassword] = useState('demo123456');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('routerescue_token', 'demo-token-operator-01');
    navigate('/dashboard');
  };

  const handleDemoAccess = () => {
    localStorage.setItem('routerescue_token', 'demo-token-operator-01');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F3E8D7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFF9F0] border border-[#E2D1BC] rounded-2xl shadow-warm-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#A66B38] to-[#5B3925] flex items-center justify-center mx-auto text-[#FFF9F0] shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[#382719]">RouteRescue AI</h1>
          <p className="text-xs text-[#7A624E]">
            Intelligent Fleet Dispatch & Mobility Decision Platform
          </p>
        </div>

        {/* Demo Fast Track Button */}
        <div className="p-4 bg-[#F3E8D7] rounded-xl border border-[#E2D1BC] text-center space-y-2">
          <div className="text-xs font-bold text-[#5B3925]">
            🚀 Instant Hackathon Demo Mode
          </div>
          <p className="text-[11px] text-[#7A624E]">
            Inspect the live dispatch simulator with pre-seeded fleet & routes instantly without typing.
          </p>
          <button
            onClick={handleDemoAccess}
            className="w-full py-2.5 bg-[#5B3925] text-[#FFF9F0] hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <span>Enter Demo Operations Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E2D1BC] w-full" />
          <span className="bg-[#FFF9F0] px-3 text-[11px] font-semibold text-[#7A624E] uppercase">
            or sign in with credentials
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#5B3925]">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-[#5B3925]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#F3E8D7] text-[#5B3925] hover:bg-[#E2D1BC] border border-[#E2D1BC] rounded-xl font-bold transition-all"
          >
            Sign In with Supabase Auth
          </button>
        </form>

        <div className="text-center text-xs text-[#7A624E]">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#5B3925] hover:underline">
            Register new fleet
          </Link>
        </div>
      </div>
    </div>
  );
};
