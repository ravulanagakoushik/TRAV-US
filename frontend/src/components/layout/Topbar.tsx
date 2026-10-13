import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.js';
import { supabase } from '../../services/supabase.js';
import {
  RefreshCw,
  Database,
  Search,
  User,
  CheckCircle2,
  LogOut,
  Truck,
  Package,
  Compass,
  Zap,
  Building2,
  Route,
  Bot,
  FileSpreadsheet,
  X,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, DeliveryStop } from '../../types/index.js';

interface TopbarProps {
  title?: string;
  onRefresh?: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'vehicle' | 'stop' | 'page' | 'tracking';
  path: string;
  icon: any;
}

const STATIC_PAGES = [
  { title: '3D City View', subtitle: 'Digital Twin & Route Geometry', path: '/city', icon: Building2 },
  { title: 'What-If Simulator', subtitle: 'Dynamic Disruption Modeling', path: '/simulator', icon: Zap },
  { title: 'Route Optimization', subtitle: 'Multi-Objective Dispatch Engine', path: '/optimization', icon: Route },
  { title: 'Fleet Operations Dashboard', subtitle: 'Overview & Fleet Metrics', path: '/dashboard', icon: Compass },
  { title: 'Fleet Vehicles', subtitle: 'Vehicle Payload & Unit Config', path: '/vehicles', icon: Truck },
  { title: 'Delivery Stops', subtitle: 'Customer Waypoints & SLA Deadlines', path: '/deliveries', icon: Package },
  { title: 'AI Mobility Advisor', subtitle: 'Gemini Operational Intelligence', path: '/advisor', icon: Bot },
  { title: 'Reports & Export', subtitle: 'Fleet Analytics Data Export', path: '/reports', icon: FileSpreadsheet },
];

export const Topbar: React.FC<TopbarProps> = ({ title = 'Operations Overview', onRefresh }) => {
  const [seeding, setSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stops, setStops] = useState<DeliveryStop[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem('routerescue_user_email') || 'dispatcher@routerescue.ai';

  // Pre-load vehicles and stops for instantaneous search indexing
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const [vList, sList] = await Promise.all([api.getVehicles(), api.getStops()]);
        setVehicles(vList || []);
        setStops(sList || []);
      } catch (e) {
        console.warn('Search index preload fallback:', e);
      }
    };
    fetchSearchData();
  }, []);

  // Live Omnisearch indexing
  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];

    // 1. Match Pages
    STATIC_PAGES.forEach((p) => {
      if (p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)) {
        results.push({
          id: `page-${p.path}`,
          title: p.title,
          subtitle: p.subtitle,
          category: 'page',
          path: p.path,
          icon: p.icon,
        });
      }
    });

    // 2. Match Vehicles
    vehicles.forEach((v) => {
      if (v.name.toLowerCase().includes(q) || v.vehicleType.toLowerCase().includes(q)) {
        results.push({
          id: `veh-${v.id}`,
          title: v.name,
          subtitle: `${v.vehicleType} • Capacity ${v.capacity} pkgs`,
          category: 'vehicle',
          path: `/vehicles`,
          icon: Truck,
        });
      }
    });

    // 3. Match Stops & Tracking Tokens
    stops.forEach((s) => {
      if (
        s.label.toLowerCase().includes(q) ||
        (s.trackingToken && s.trackingToken.toLowerCase().includes(q))
      ) {
        results.push({
          id: `stop-${s.id}`,
          title: s.label,
          subtitle: `Ref: ${s.trackingToken || 'Pending'} • ${s.demand} pkgs [${s.priority.toUpperCase()}]`,
          category: s.trackingToken ? 'tracking' : 'stop',
          path: s.trackingToken ? `/track/${s.trackingToken}` : `/deliveries`,
          icon: Package,
        });
      }
    });

    // 4. Raw Tracking Query if it looks like token format
    if (q.startsWith('trk-') || (!results.some((r) => r.category === 'tracking') && q.length > 3)) {
      results.unshift({
        id: `raw-track-${q}`,
        title: `Track Customer Order: "${searchTerm.toUpperCase()}"`,
        subtitle: `Direct Live GPS Customer Tracking Portal`,
        category: 'tracking',
        path: `/track/${encodeURIComponent(searchTerm.trim())}`,
        icon: Search,
      });
    }

    setSearchResults(results.slice(0, 8));
  }, [searchTerm, vehicles, stops]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    } else if (searchTerm.trim()) {
      navigate(`/track/${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  const handleSelectResult = (r: SearchResult) => {
    navigate(r.path);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

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
    <header className="h-16 bg-[#FFF9F0] border-b border-[#E2D1BC] px-6 flex items-center justify-between shrink-0 shadow-warm-sm z-30 relative">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-extrabold text-[#382719] tracking-tight hover:text-[#5B3925] transition-colors duration-200">
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
        {/* Universal Omnisearch Command Bar */}
        <div ref={searchRef} className="relative hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search vehicles, stops, track ID, city..."
              value={searchTerm}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-64 lg:w-72 text-xs bg-[#F3E8D7] border border-[#E2D1BC] text-[#382719] pl-8 pr-7 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B3925] focus:bg-white focus:w-80 hover:border-[#A66B38] transition-all duration-200 shadow-sm"
            />
            <Search className="w-3.5 h-3.5 text-[#7A624E] absolute left-2.5 top-2.5" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                className="absolute right-2.5 top-2 text-[#7A624E] hover:text-[#382719]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Omnisearch Interactive Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 mt-2 w-80 lg:w-96 bg-[#FFF9F0] border border-[#E2D1BC] rounded-2xl shadow-warm-xl overflow-hidden z-50 animate-fadeIn">
              <div className="p-2 border-b border-[#E2D1BC]/60 bg-[#F3E8D7]/60 flex items-center justify-between text-[10px] font-bold text-[#7A624E] uppercase tracking-wider">
                <span>Search Suggestions ({searchResults.length})</span>
                <span>Press Enter to Select</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#E2D1BC]/40">
                {searchResults.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectResult(r)}
                      className="w-full p-2.5 text-left hover:bg-[#F3E8D7] flex items-center gap-3 transition-colors group cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-[#E2D1BC]/60 group-hover:bg-[#5B3925] group-hover:text-white text-[#5B3925] transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-[#382719] group-hover:text-[#5B3925] truncate">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-[#7A624E] truncate">{r.subtitle}</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-[#C4AC94] group-hover:text-[#5B3925] shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Demo Seed Button */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="group flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5B3925] text-[#FFF9F0] hover:bg-[#382416] text-xs font-semibold rounded-xl shadow-sm hover:shadow-lg hover:shadow-[#5B3925]/25 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60"
          title="Seed realistic Metro dataset"
        >
          <Database className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-115 group-hover:-rotate-6" />
          <span>{seeding ? 'Seeding...' : 'Load Sample Data'}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          disabled={seeding}
          className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8D7] text-[#5B3925] hover:bg-[#E2D1BC] hover:border-[#A66B38] text-xs font-semibold rounded-xl border border-[#E2D1BC] shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60"
          title="Reset to default fleet state"
        >
          <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180 ${seeding ? 'animate-spin' : ''}`} />
          <span>Reset</span>
        </button>

        {/* User Info Badge */}
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

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#FFEBEE] hover:bg-[#B71C1C] text-[#B71C1C] hover:text-[#FFF9F0] border border-[#FFCDD2] hover:border-[#B71C1C] rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          title="Log out of application"
        >
          <LogOut className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
