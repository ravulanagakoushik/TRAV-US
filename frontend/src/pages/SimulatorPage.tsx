import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import {
  OptimizationRun,
  DisruptionScenario,
  ScenarioType,
  Vehicle,
} from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Map2D } from '../components/map/Map2D.js';
import {
  Zap,
  Play,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Truck,
  RotateCcw,
  Bot,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SimulatorPage: React.FC = () => {
  const [baselineRun, setBaselineRun] = useState<OptimizationRun | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [scenarioType, setScenarioType] = useState<ScenarioType>('traffic');
  const [scenarioName, setScenarioName] = useState('Metro Rush Hour Congestion');
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
      if (runs.length > 0) {
        setBaselineRun(runs[0]);
      } else {
        const seeded = await api.seedDemoData();
        setBaselineRun(seeded.initialRun);
      }
      const v = await api.getVehicles();
      setVehicles(v);
      if (v.length > 0) setBreakdownVehicleId(v[0].id);
    } catch (err) {
      console.error('Failed to load simulator data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunSimulation = async () => {
    if (!baselineRun) return;

    try {
      setSimulating(true);

      const configuration: any = {
        description: `What-If Disruption Scenario: ${scenarioType}`,
      };

      if (scenarioType === 'traffic') {
        configuration.congestionMultiplier = congestionMultiplier;
      } else if (scenarioType === 'vehicle_breakdown') {
        configuration.breakdownVehicleId = breakdownVehicleId;
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
        baselineRunId: baselineRun.id,
        scenarioType,
        configuration,
      });

      setActiveScenario(res.scenario);
      setChangedAssignments(res.changedAssignments);
    } catch (err) {
      console.error('Simulation execution failed', err);
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
        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-6 shadow-warm space-y-5">
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
                Baseline optimization run remains immutable. Dynamic rerouting calculates consequences in real time.
              </p>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={simulating || !baselineRun}
              className="group px-6 py-2.5 bg-[#B71C1C] text-white hover:bg-red-800 rounded-xl font-bold text-sm shadow-warm hover:shadow-xl hover:shadow-red-900/30 hover:scale-105 active:scale-95 flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
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
                    Traffic Congestion Multiplier: <b className="text-[#382719]">{congestionMultiplier}x</b>
                  </label>
                  <input
                    type="range"
                    min="1.2"
                    max="3.5"
                    step="0.1"
                    value={congestionMultiplier}
                    onChange={(e) => setCongestionMultiplier(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-[#B71C1C]"
                  />
                  <div className="flex justify-between text-[10px] text-[#7A624E]">
                    <span>1.2x (Minor Delay)</span>
                    <span>2.2x (Heavy Rush)</span>
                    <span>3.5x (Gridlock)</span>
                  </div>
                </div>
              )}

              {scenarioType === 'vehicle_breakdown' && (
                <div>
                  <label className="text-xs font-semibold text-[#5B3925]">Select Failing Vehicle</label>
                  <select
                    value={breakdownVehicleId}
                    onChange={(e) => setBreakdownVehicleId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-[#E2D1BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B3925]"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.vehicleType} - Capacity: {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scenarioType === 'urgent_delivery' && (
                <div>
                  <label className="text-xs font-semibold text-[#5B3925]">Urgent Parcel Destination</label>
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

        {/* Delta Metrics Callout (Before vs After) */}
        {deltas && (
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-6 shadow-warm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-[#382719]">
                  Disruption Impact Assessment Results
                </h3>
                <p className="text-xs text-[#7A624E]">
                  Net variances between baseline schedule and revised plan
                </p>
              </div>

              <button
                onClick={() => navigate('/advisor')}
                className="px-4 py-2 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Bot className="w-4 h-4 text-[#D4A373]" />
                Ask Gemini to Explain Consequences &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Added Travel Time</span>
                <div className="text-2xl font-black text-red-900 mt-1">
                  +{deltas.durationDiffMinutes} min
                </div>
                <div className="text-[11px] text-red-700 mt-1">Total route delay impact</div>
              </div>

              <div className="p-4 rounded-xl bg-[#FEF3D6] border border-[#FFE082]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Detour Distance</span>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {deltas.distanceDiffKm > 0 ? `+${deltas.distanceDiffKm}` : deltas.distanceDiffKm} km
                </div>
                <div className="text-[11px] text-amber-800 mt-1">Street detour variance</div>
              </div>

              <div className="p-4 rounded-xl bg-[#FEF3D6] border border-[#FFE082]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Newly At-Risk Deliveries</span>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  +{deltas.newlyAtRiskCount} stops
                </div>
                <div className="text-[11px] text-amber-800 mt-1">SLA deadline sensitivity</div>
              </div>

              <div className="p-4 rounded-xl bg-[#E3F2FD] border border-[#BBDEFB]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Reassigned Deliveries</span>
                <div className="text-2xl font-black text-blue-900 mt-1">
                  {deltas.reassignedStopsCount} stops
                </div>
                <div className="text-[11px] text-blue-800 mt-1">Absorbed by spare capacity</div>
              </div>
            </div>
          </div>
        )}

        {/* Changed Assignments Table */}
        {changedAssignments.length > 0 && (
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm">
            <h3 className="font-bold text-[#382719] text-base mb-3">Vehicle Reassignment Manifest</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3E8D7] text-[#5B3925] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Vehicle Unit</th>
                    <th className="py-2.5 px-3">Original Stops</th>
                    <th className="py-2.5 px-3">Revised Stops</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Operational Adaptation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D1BC]/60">
                  {changedAssignments.map((a) => (
                    <tr key={a.vehicleId} className="hover:bg-[#F3E8D7]/30">
                      <td className="py-3 px-3 font-bold text-[#382719]">{a.vehicleName}</td>
                      <td className="py-3 px-3">{a.originalStopsCount} stops</td>
                      <td className="py-3 px-3 font-bold text-[#5B3925]">{a.newStopsCount} stops</td>
                      <td className="py-3 px-3 font-medium text-[#7A624E]">
                        <span className="px-2.5 py-1 rounded-full bg-[#F3E8D7] text-[#5B3925] text-xs">
                          {a.statusNote}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revised Plan Map View */}
        {revisedRun && (
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm">
            <h3 className="font-bold text-[#382719] text-base mb-1">Revised Route Topology</h3>
            <p className="text-xs text-[#7A624E] mb-4">Dynamically adapted route lines following simulated event</p>
            <Map2D
              stops={revisedRun.assignments.flatMap((a) => a.stops.map((s) => s.deliveryStop))}
              assignments={revisedRun.assignments}
              height="440px"
            />
          </div>
        )}
      </div>
    </div>
  );
};
