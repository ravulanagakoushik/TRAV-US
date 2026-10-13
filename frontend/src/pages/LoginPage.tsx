import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (supabase) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          localStorage.setItem('routerescue_token', data.session.access_token);
          localStorage.setItem('routerescue_user_email', data.user?.email || email);
          navigate('/dashboard');
          return;
        }
      }

      // Simple local fallback if Supabase auth is not returned
      localStorage.setItem('routerescue_token', 'demo-token-operator-01');
      localStorage.setItem('routerescue_user_email', email);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    localStorage.setItem('routerescue_token', 'demo-token-operator-01');
    localStorage.setItem('routerescue_user_email', 'dispatcher@routerescue.ai');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F3E8D7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFF9F0] border border-[#E2D1BC] rounded-2xl shadow-warm-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#A66B38] to-[#5B3925] flex items-center justify-center mx-auto text-[#FFF9F0] shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[#382719]">Sign In</h1>
          <p className="text-xs text-[#7A624E]">
            RouteRescue AI Smart Fleet Optimization Platform
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#5B3925]">Email Address</label>
            <input
              type="email"
              required
              placeholder="operator@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 bg-white border border-[#E2D1BC] rounded-xl text-xs text-[#382719] focus:outline-none focus:ring-2 focus:ring-[#5B3925]"
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
              className="w-full mt-1.5 px-3 py-2.5 bg-white border border-[#E2D1BC] rounded-xl text-xs text-[#382719] focus:outline-none focus:ring-2 focus:ring-[#5B3925]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#5B3925] text-[#FFF9F0] hover:bg-[#382416] rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E2D1BC] w-full" />
          <span className="bg-[#FFF9F0] px-3 text-[11px] font-semibold text-[#7A624E] uppercase">
            or quick demo
          </span>
        </div>

        {/* Instant Demo Access Button */}
        <button
          onClick={handleDemoAccess}
          type="button"
          className="w-full py-2.5 bg-[#F3E8D7] text-[#5B3925] hover:bg-[#E2D1BC] border border-[#E2D1BC] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
        >
          <span>1-Click Demo Operator Access</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="text-center text-xs text-[#7A624E]">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#5B3925] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
