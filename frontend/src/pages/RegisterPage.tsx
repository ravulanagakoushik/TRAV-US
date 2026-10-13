import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
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
          <h1 className="text-2xl font-black text-[#382719]">Register New Fleet</h1>
          <p className="text-xs text-[#7A624E]">
            Create your RouteRescue AI dispatch organization
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#5B3925]">Organization Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Express Logistics"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-[#5B3925]">Dispatcher Email</label>
            <input
              type="email"
              required
              placeholder="admin@apexlogistics.com"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#5B3925] text-[#FFF9F0] hover:bg-[#382416] rounded-xl font-bold transition-all shadow-sm"
          >
            Create Fleet Account
          </button>
        </form>

        <div className="text-center text-xs text-[#7A624E]">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#5B3925] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
