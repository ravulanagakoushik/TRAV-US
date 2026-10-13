import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { OptimizationRun, Vehicle, DeliveryStop, DisruptionScenario } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { CityScene } from '../components/city/CityScene.js';
import { Map2D } from '../components/map/Map2D.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Building2,
  Map,
  Truck,
  Navigation,
  Eye,
  Clock,
  ShieldAlert,
  Radio,
  Zap,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const CityPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSimulatedParam = searchParams.get('simulated') === 'true';
  const isOptimizedParam = searchParams.get('optimized') === 'true';
  const initialMode = searchParams.get('mode') === 'satellite' ? 'satellite' : '3d';

  const [run, setRun] = useState<OptimizationRun | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'satellite' | '2d' | 'split'>(initialMode);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<DisruptionScenario | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      let activeRun: OptimizationRun | null = null;

      // Check saved latest run if simulated or optimized
      const savedLatestRun = localStorage.getItem('routerescue_latest_run');
      if (savedLatestRun) {
        try {
          activeRun = JSON.parse(savedLatestRun);
        } catch (e) {
          console.error(e);
        }
      }

      if (isSimulatedParam) {
        const savedScenario = localStorage.getItem('routerescue_active_scenario');
        if (savedScenario) {
          try {
            setActiveScenario(JSON.parse(savedScenario));
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        setActiveScenario(null);
      }

      if (!activeRun) {
        const runs = await api.getOptimizationRuns();
        if (runs.length > 0) {
          activeRun = runs[0];
        } else {
          const seeded = await api.seedDemoData();
          activeRun = seeded.initialRun;
        }
      }

      setRun(activeRun);
      const v = await api.getVehicles();
      const s = await api.getStops();
      setVehicles(v);
      setStops(s);
    } catch (err) {
      console.error('Failed to load city data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isSimulatedParam, isOptimizedParam]);

  const resetToBaseline = async () => {
    localStorage.removeItem('routerescue_latest_run');
    localStorage.removeItem('routerescue_active_scenario');
    setActiveScenario(null);
    navigate('/city');
  };

  const selectedAssignment = run?.assignments.find((a) => a.vehicleId === selectedVehicleId);

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Interactive 3D Fleet City & Satellite Reconnaissance" onRefresh={loadData} />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Active Optimization Success Banner */}
        {isOptimizedParam && (
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-[#382719] text-white p-5 rounded-2xl border border-emerald-500/60 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-600/30 border border-emerald-500/60 text-emerald-400 mt-0.5">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Route Optimization Deployed
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    Objective: {run?.objective?.replace(/_/g, ' ') || 'Balanced Time & Distance'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Heuristic Routing Plan Synchronized in 3D City Twin
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Dynamic multi-stop dispatch calculated across {run?.assignments.length || 0} active vehicles. Zero SLA violations. Switch to Satellite View for real-time telemetry.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
              <button
                onClick={() => setViewMode('satellite')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
                Satellite Recon View
              </button>
            </div>
          </div>
        )}

        {/* Active Disruption Simulation Banner */}
        {isSimulatedParam && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-950 via-slate-900 to-[#382719] text-white p-5 rounded-2xl border border-red-500/60 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-red-600/30 border border-red-500/60 text-red-400 mt-0.5">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                    Active Disruption Simulation
                  </span>
                  {activeScenario && (
                    <span className="text-xs font-semibold text-slate-300">
                      Scenario: {activeScenario.name} ({activeScenario.scenarioType.replace('_', ' ')})
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Dynamic Route Reconfiguration Deployed in 3D City Twin
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Affected stops re-assigned and route geometry dynamically recomputed. Switch to Satellite View to observe real-time telemetry motion graphics.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
              <button
                onClick={() => setViewMode('satellite')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
                Satellite Recon View
              </button>
              <button
                onClick={resetToBaseline}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Baseline
              </button>
            </div>
          </div>
        )}

        {/* Controls Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FFF9F0] p-4 rounded-xl border border-[#E2D1BC] shadow-warm">
          <div>
            <h2 className="text-lg font-bold text-[#382719] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#A66B38]" />
              Digital Twin & Route Geometry Visualizer
            </h2>
            <p className="text-xs text-[#7A624E]">
              Synchronized 3D urban environment animating dispatch coordinates with satellite telemetry & motion graphics
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-[#F3E8D7] p-1 rounded-xl border border-[#E2D1BC] shadow-sm flex-wrap">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-[#5B3925] text-[#FFF9F0] shadow-sm'
                  : 'text-[#7A624E] hover:text-[#382719] hover:bg-white/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              3D City
            </button>
            <button
              onClick={() => setViewMode('satellite')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                viewMode === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                  : 'text-[#7A624E] hover:text-emerald-700 hover:bg-white/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
              Satellite View
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-[#5B3925] text-[#FFF9F0] shadow-sm'
                  : 'text-[#7A624E] hover:text-[#382719] hover:bg-white/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Split 3D/2D
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                viewMode === '2d'
                  ? 'bg-[#5B3925] text-[#FFF9F0] shadow-sm'
                  : 'text-[#7A624E] hover:text-[#382719] hover:bg-white/60'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              2D Map
            </button>
          </div>
        </div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Visualizer (3D or Satellite or 2D or Split) */}
          <div className={`${viewMode === 'split' ? 'lg:col-span-3' : 'lg:col-span-3'} space-y-4`}>
            {viewMode === '3d' && (
              <CityScene
                stops={stops}
                assignments={run?.assignments || []}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
                viewMode="3d"
              />
            )}

            {viewMode === 'satellite' && (
              <CityScene
                stops={stops}
                assignments={run?.assignments || []}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
                viewMode="satellite"
              />
            )}

            {viewMode === '2d' && (
              <Map2D
                stops={stops}
                assignments={run?.assignments || []}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
                height="620px"
              />
            )}

            {viewMode === 'split' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <CityScene
                  stops={stops}
                  assignments={run?.assignments || []}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={setSelectedVehicleId}
                  viewMode="3d"
                />
                <Map2D
                  stops={stops}
                  assignments={run?.assignments || []}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={setSelectedVehicleId}
                  height="620px"
                />
              </div>
            )}
          </div>

          {/* Vehicle Inspector Side Panel */}
          <div className="lg:col-span-1 bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm flex flex-col h-[620px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D1BC]">
              <h3 className="font-bold text-[#382719] text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#5B3925]" />
                Fleet Inspector
              </h3>
              {selectedVehicleId && (
                <button
                  onClick={() => setSelectedVehicleId(null)}
                  className="text-[11px] text-[#A66B38] font-bold hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {selectedAssignment ? (
              <div className="flex-1 overflow-y-auto mt-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-base text-[#382719]">{selectedAssignment.vehicleName}</h4>
                  <p className="text-[#7A624E]">{selectedAssignment.vehicleType}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#F3E8D7] p-3 rounded-lg">
                  <div>
                    <span className="text-[10px] uppercase text-[#7A624E] font-semibold">Distance</span>
                    <div className="font-bold text-sm text-[#382719]">{selectedAssignment.totalDistanceKm} km</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#7A624E] font-semibold">Travel Time</span>
                    <div className="font-bold text-sm text-[#382719]">{selectedAssignment.estimatedDurationMinutes} min</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#7A624E] font-semibold">Utilization</span>
                    <div className="font-bold text-sm text-[#5B3925]">{selectedAssignment.utilizationPercent}%</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#7A624E] font-semibold">Stops</span>
                    <div className="font-bold text-sm text-[#382719]">{selectedAssignment.stopsCount} stops</div>
                  </div>
                </div>

                {/* Stop Sequence Itinerary */}
                <div>
                  <h5 className="font-bold text-xs text-[#382719] mb-2">Stop Sequence Itinerary</h5>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedAssignment.stops.map((s) => (
                      <div
                        key={s.id}
                        className="p-2 rounded bg-white border border-[#E2D1BC] space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-[#5B3925]">#{s.sequenceNumber}</span>
                          <StatusBadge status={s.deliveryStop.priority} type="priority" />
                        </div>
                        <div className="text-[11px] text-[#382719] font-medium line-clamp-1">
                          {s.deliveryStop.label}
                        </div>
                        <div className="text-[10px] text-[#7A624E] flex items-center justify-between">
                          <span>ETA: {new Date(s.estimatedArrivalAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>{s.distanceFromPreviousKm} km</span>
                        </div>
                        {s.riskReason && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded font-medium">
                            ⚠️ {s.riskReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-[#7A624E]">
                <Navigation className="w-10 h-10 text-[#C4AC94] mb-2 animate-bounce" />
                <p className="font-semibold text-xs text-[#382719]">Click a vehicle in 3D or 2D</p>
                <p className="text-[11px] mt-1">
                  Inspect assigned timetable, waypoints, and SLA delay risk buffers.
                </p>

                <div className="w-full mt-6 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A624E]">
                    Available Active Units
                  </span>
                  {run?.assignments.map((a) => (
                    <button
                      key={a.vehicleId}
                      onClick={() => setSelectedVehicleId(a.vehicleId)}
                      className="group w-full p-2.5 text-left rounded-xl bg-[#F3E8D7] hover:bg-[#5B3925] hover:text-[#FFF9F0] text-xs font-semibold text-[#382719] flex items-center justify-between transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer"
                    >
                      <span className="truncate group-hover:translate-x-1 transition-transform">{a.vehicleName}</span>
                      <span className="text-[#5B3925] group-hover:text-amber-200 font-bold transition-colors">{a.stopsCount} stops</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
