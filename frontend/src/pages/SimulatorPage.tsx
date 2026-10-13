import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { localDataService } from '../services/localDataService.js';
import { OptimizationRun, DisruptionScenario, Vehicle } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Zap,
  Activity,
  ArrowRight,
  TrendingDown,
  Clock,
  Navigation,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ScenarioType = 'traffic' | 'vehicle_breakdown' | 'road_closure' | 'urgent_delivery';

export const SimulatorPage: React.FC = () => {
  const [baselineRun, setBaselineRun] = useState<OptimizationRun | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Scenario Config
  const [scenarioType, setScenarioType] = useState<ScenarioType>('traffic');
  const [scenarioName, setScenarioName] = useState('Severe Downtown Traffic Surge');
  const [congestionMultiplier, setCongestionMultiplier] = useState(2.2);
  const [breakdownVehicleId, setBreakdownVehicleId] = useState<string>('');
  const [urgentStopLabel, setUrgentStopLabel] = useState('Emergency St. Jude Medical Supply Dispatch');
  
  const [simulating, setSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState<DisruptionScenario | null>(null);
  const [changedAssignments, setChangedAssignments] = useState<any[]>([]);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const runs = await api.getOptimizationRuns();
      if (runs && runs.length > 0) {
        setBaselineRun(runs[0]);
      } else {
        const seeded = await api.seedDemoData();
        setBaselineRun(seeded.initialRun);
      }
      const v = await api.getVehicles();
      setVehicles(v);
      if (v.length > 0) setBreakdownVehicleId(v[0].id);
    } catch (err) {
      console.warn('Simulator loadData fallback to localDataService:', err);
      const fallbackRun = localDataService.getLatestRun();
      setBaselineRun(fallbackRun);
      const fallbackVehicles = localDataService.getVehicles();
      setVehicles(fallbackVehicles);
      if (fallbackVehicles.length > 0) setBreakdownVehicleId(fallbackVehicles[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunSimulation = async () => {
    let runToUse = baselineRun;
    if (!runToUse) {
      runToUse = localDataService.getLatestRun();
      setBaselineRun(runToUse);
    }

    try {
      setSimulating(true);

      const configuration: any = {
        description: `What-If Disruption Scenario: ${scenarioType}`,
      };

      if (scenarioType === 'traffic') {
        configuration.congestionMultiplier = congestionMultiplier;
      } else if (scenarioType === 'vehicle_breakdown') {
        configuration.breakdownVehicleId = breakdownVehicleId || (vehicles[0]?.id || 'veh-01');
      } else if (scenarioType === 'urgent_delivery') {
        configuration.urgentStop = {
          label: urgentStopLabel,
          latitude: 37.785,
          longitude: -122.42,
          demand: 3,
          priority: 'urgent',
        };
      } else if (scenarioType === 'road_closure') {
        configuration.closedAreaBounds = {
          minLat: 37.77,
          maxLat: 37.785,
          minLng: -122.42,
          maxLng: -122.405,
        };
      }

      const res = await api.createScenario({
        name: scenarioName,
        baselineRunId: runToUse.id,
        scenarioType,
        configuration,
      });

      setActiveScenario(res.scenario);
      setChangedAssignments(res.changedAssignments);

      // Save revised run & scenario so 3D City View immediately reflects the disruption!
      if (res.scenario?.revisedRun) {
        localStorage.setItem('routerescue_latest_run', JSON.stringify(res.scenario.revisedRun));
        localStorage.setItem('routerescue_active_scenario', JSON.stringify(res.scenario));
      }

      // Automatically redirect to the 3D City View with motion graphics!
      setTimeout(() => {
        navigate('/city?simulated=true');
      }, 500);
    } catch (err) {
      console.warn('Simulation execution fallback to client-side simulator:', err);
      const fallbackRes = localDataService.simulateDisruption(runToUse, scenarioType, scenarioName, {});
      setActiveScenario(fallbackRes.scenario);
      navigate('/city?simulated=true');
    } finally {
      setSimulating(false);
    }
  };

  const revisedRun = activeScenario?.revisedRun;
  const deltas = activeScenario?.metricDeltas;

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="What-If Mobility Disruption Simulator" onRefresh={loadData} />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Simulator Header & Scenario Config */}
        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-2xl p-6 shadow-warm space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-1.5">
                <Activity className="w-3.5 h-3.5" />
                Differentiator: What-If Mobility Sandbox
              </div>
              <h2 className="text-xl font-bold text-[#382719]">
                Introduce Disruption & Recalculate Dynamic Plan
              </h2>
              <p className="text-xs text-[#7A624E]">
                Executes the disruption scenario, calculates detour consequences in real time, and redirects directly to the 3D Digital Twin City!
              </p>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="group px-6 py-3 bg-[#B71C1C] text-white hover:bg-red-800 rounded-xl font-bold text-sm shadow-warm hover:shadow-xl hover:shadow-red-900/30 hover:scale-105 active:scale-95 flex items-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-115 group-hover:rotate-12" />
              <span>{simulating ? 'Simulating Dynamic Reroute...' : 'Execute Disruption Simulation'}</span>
            </button>
          </div>

          {/* Scenario Type Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'traffic',
                label: '1. Traffic Congestion Surge',
                desc: 'Simulate severe traffic slowdown multiplier on urban road network.',
              },
              {
                id: 'vehicle_breakdown',
                label: '2. Vehicle Breakdown',
                desc: 'Take an active van offline; automatically reassign pending stops.',
              },
              {
                id: 'road_closure',
                label: '3. Major Road Closure',
                desc: 'Block central downtown corridor and force detour re-routing.',
              },
              {
                id: 'urgent_delivery',
                label: '4. Urgent On-Demand Delivery',
                desc: 'Dynamically insert high-priority medical parcel into active routes.',
              },
            ].map((tab) => (
              <div
                key={tab.id}
                onClick={() => {
                  setScenarioType(tab.id as ScenarioType);
                  if (tab.id === 'traffic') setScenarioName('Severe Downtown Traffic Surge');
                  else if (tab.id === 'vehicle_breakdown') setScenarioName('Mid-Route Vehicle Mechanical Failure');
                  else if (tab.id === 'road_closure') setScenarioName('Central Transit Corridor Blockade');
                  else if (tab.id === 'urgent_delivery') setScenarioName('Urgent Hospital Dispatch Insertion');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-warm-md ${
                  scenarioType === tab.id
                    ? 'bg-[#F3E8D7] border-[#B71C1C] ring-1 ring-[#B71C1C]'
                    : 'bg-white border-[#E2D1BC] hover:border-[#B71C1C]'
                }`}
              >
                <h4 className="font-bold text-sm text-[#382719] mb-1">{tab.label}</h4>
                <p className="text-xs text-[#7A624E]">{tab.desc}</p>
              </div>
            ))}
          </div>

          {/* Scenario Parameters Form */}
          <div className="p-4 bg-[#F3E8D7]/60 rounded-xl border border-[#E2D1BC] space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#5B3925]">Scenario Title</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-white border border-[#E2D1BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B3925]"
                />
              </div>

              {scenarioType === 'traffic' && (
                <div>
                  <label className="text-xs font-semibold text-[#5B3925]">
                    Traffic Congestion Multiplier ({congestionMultiplier}x Delay)
                  </label>
                  <input
                    type="range"
                    min="1.2"
                    max="4.0"
                    step="0.1"
                    value={congestionMultiplier}
                    onChange={(e) => setCongestionMultiplier(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-[#B71C1C]"
                  />
                </div>
              )}

              {scenarioType === 'vehicle_breakdown' && (
                <div>
                  <label className="text-xs font-semibold text-[#5B3925]">Select Disabled Vehicle</label>
                  <select
                    value={breakdownVehicleId}
                    onChange={(e) => setBreakdownVehicleId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-[#E2D1BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B3925]"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scenarioType === 'urgent_delivery' && (
                <div>
                  <label className="text-xs font-semibold text-[#5B3925]">Urgent Stop Label</label>
                  <input
                    type="text"
                    value={urgentStopLabel}
                    onChange={(e) => setUrgentStopLabel(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-[#E2D1BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B3925]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Delta Impact Banner if simulated */}
        {activeScenario && deltas && (
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-2xl p-6 shadow-warm space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                  ⚡ Active Disruption Impact Assessment
                </span>
                <h3 className="font-extrabold text-lg text-[#382719] mt-0.5">
                  {activeScenario.name}
                </h3>
              </div>
              <button
                onClick={() => navigate('/city?simulated=true')}
                className="px-4 py-2 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:scale-105 transition-all"
              >
                <Building2 className="w-4 h-4" />
                <span>Inspect in 3D City View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <span className="text-[10px] font-bold uppercase text-red-800">Delay Time Impact</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-red-900">+{deltas.durationDiffMinutes} min</span>
                  <Clock className="w-4 h-4 text-red-700" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800">Detour Extra Distance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-900">+{deltas.distanceDiffKm} km</span>
                  <Navigation className="w-4 h-4 text-amber-700" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800">Additional Carbon</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-900">+{(deltas.distanceDiffKm * 0.24).toFixed(1)} kg</span>
                  <TrendingDown className="w-4 h-4 text-amber-700 rotate-180" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Dynamic Reassignment</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-900">
                    {changedAssignments.length} vans
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
