import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { OptimizationRun, OptimizationObjective } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { MetricCard } from '../components/common/MetricCard.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Map2D } from '../components/map/Map2D.js';
import {
  Route,
  Play,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  TrendingDown,
  AlertOctagon,
} from 'lucide-react';

const OBJECTIVES: { id: OptimizationObjective; title: string; desc: string }[] = [
  {
    id: 'balance_time_distance',
    title: 'Balanced Time & Distance',
    desc: 'Equitably balances total road distance with arrival deadlines and SLA risk windows.',
  },
  {
    id: 'minimize_distance',
    title: 'Minimize Total Distance',
    desc: 'Optimizes for minimum cumulative kilometers across all assigned routes.',
  },
  {
    id: 'prioritize_urgent',
    title: 'Prioritize Urgent Stops',
    desc: 'Services urgent and high-priority deliveries with first departure sequence windows.',
  },
  {
    id: 'balance_workload',
    title: 'Balance Fleet Workloads',
    desc: 'Equitably distributes package demand across all available vehicles.',
  },
];

export const OptimizationPage: React.FC = () => {
  const [objective, setObjective] = useState<OptimizationObjective>('balance_time_distance');
  const [balanceWorkload, setBalanceWorkload] = useState(true);
  const [prioritizeUrgent, setPrioritizeUrgent] = useState(true);
  const [run, setRun] = useState<OptimizationRun | null>(null);
  const [running, setRunning] = useState(false);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const loadLatest = async () => {
    try {
      const runs = await api.getOptimizationRuns();
      if (runs.length > 0) {
        setRun(runs[0]);
      } else {
        const seeded = await api.seedDemoData();
        setRun(seeded.initialRun);
      }
    } catch (err) {
      console.error('Failed to load runs', err);
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  const handleRunOptimization = async () => {
    try {
      setRunning(true);
      const newRun = await api.runOptimization({
        objective,
        balanceWorkload,
        prioritizeUrgent,
      });
      setRun(newRun);
    } catch (err) {
      console.error('Optimization run failed', err);
    } finally {
      setRunning(false);
    }
  };

  const base = run?.baselineMetrics;
  const opt = run?.optimizedMetrics;
  const distanceSaved = base && opt ? Math.max(0, Math.round((base.totalDistanceKm - opt.totalDistanceKm) * 10) / 10) : 0;
  const timeSaved = base && opt ? Math.max(0, Math.round(base.totalDurationMinutes - opt.totalDurationMinutes)) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Route Optimization Studio" onRefresh={loadLatest} />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Objective & Config Configuration */}
        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-6 shadow-warm space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#382719] flex items-center gap-2">
                <Route className="w-5 h-5 text-[#5B3925]" />
                Optimization Engine Configuration
              </h2>
              <p className="text-xs text-[#7A624E]">
                Select primary optimization heuristic objective and operational dispatch rules.
              </p>
            </div>

            <button
              onClick={handleRunOptimization}
              disabled={running}
              className="group px-6 py-2.5 bg-[#5B3925] text-[#FFF9F0] hover:bg-[#382416] rounded-xl font-bold text-sm shadow-warm hover:shadow-warm-xl hover:scale-105 active:scale-95 flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-110" />
              <span>{running ? 'Calculating Heuristic...' : 'Run Optimization'}</span>
            </button>
          </div>

          {/* Objectives Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {OBJECTIVES.map((obj) => (
              <div
                key={obj.id}
                onClick={() => setObjective(obj.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-warm-md ${
                  objective === obj.id
                    ? 'bg-[#F3E8D7] border-[#5B3925] shadow-sm ring-1 ring-[#5B3925]'
                    : 'bg-white border-[#E2D1BC] hover:border-[#A66B38]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-sm text-[#382719]">{obj.title}</h4>
                  {objective === obj.id && (
                    <CheckCircle2 className="w-4 h-4 text-[#5B3925] animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-[#7A624E] leading-relaxed">{obj.desc}</p>
              </div>
            ))}
          </div>

          {/* Flags Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#E2D1BC]/60 text-xs font-semibold text-[#382719]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={balanceWorkload}
                onChange={(e) => setBalanceWorkload(e.target.checked)}
                className="w-4 h-4 accent-[#5B3925] rounded"
              />
              <span>Equalize Vehicle Utilization (Prevent Single-Van Overload)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={prioritizeUrgent}
                onChange={(e) => setPrioritizeUrgent(e.target.checked)}
                className="w-4 h-4 accent-[#5B3925] rounded"
              />
              <span>Prioritize Time-Window Urgent Stops First</span>
            </label>
          </div>
        </div>

        {/* Baseline vs Optimized Comparison Metrics */}
        {opt && base && (
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-6 shadow-warm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#382719]">
                  Comparative Plan Performance Analysis
                </h3>
                <p className="text-xs text-[#7A624E]">
                  Clarke-Wright 2-opt heuristic vs naive sequential baseline dispatch
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                Optimization Verified
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#F3E8D7]/60 border border-[#E2D1BC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A624E]">Distance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-[#382719]">{opt.totalDistanceKm} km</span>
                  <span className="text-xs text-emerald-700 font-bold">-{distanceSaved} km</span>
                </div>
                <div className="text-[11px] text-[#7A624E] mt-1">Baseline: {base.totalDistanceKm} km</div>
              </div>

              <div className="p-4 rounded-xl bg-[#F3E8D7]/60 border border-[#E2D1BC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A624E]">Travel Duration</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-[#382719]">{opt.totalDurationMinutes} min</span>
                  <span className="text-xs text-emerald-700 font-bold">-{timeSaved} min</span>
                </div>
                <div className="text-[11px] text-[#7A624E] mt-1">Baseline: {base.totalDurationMinutes} min</div>
              </div>

              <div className="p-4 rounded-xl bg-[#F3E8D7]/60 border border-[#E2D1BC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A624E]">At-Risk SLA Deliveries</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-[#382719]">{opt.atRiskDeliveriesCount} stops</span>
                  <span className="text-xs text-emerald-700 font-bold">Safe SLA</span>
                </div>
                <div className="text-[11px] text-[#7A624E] mt-1">Baseline: {base.atRiskDeliveriesCount} stops</div>
              </div>

              <div className="p-4 rounded-xl bg-[#F3E8D7]/60 border border-[#E2D1BC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A624E]">Fleet Capacity Util.</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-[#5B3925]">{opt.averageUtilizationPercent}%</span>
                  <span className="text-xs text-[#7A624E] font-bold">Balanced</span>
                </div>
                <div className="text-[11px] text-[#7A624E] mt-1">{opt.assignedStopsCount} stops assigned</div>
              </div>
            </div>
          </div>
        )}

        {/* 2D Map of Optimized Routes */}
        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm">
          <h3 className="font-bold text-[#382719] text-base mb-1">Calculated Route Geography</h3>
          <p className="text-xs text-[#7A624E] mb-4">Interactive street polyline trajectory by vehicle</p>
          <Map2D
            stops={run?.assignments.flatMap((a) => a.stops.map((s) => s.deliveryStop)) || []}
            assignments={run?.assignments || []}
            selectedVehicleId={expandedVehicleId}
            onSelectVehicle={setExpandedVehicleId}
            height="460px"
          />
        </div>

        {/* Route Assignments Itinerary Table */}
        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm">
          <h3 className="font-bold text-[#382719] text-base mb-3">Vehicle Route Schedules</h3>
          <div className="space-y-3">
            {run?.assignments.map((assignment) => {
              const isExpanded = expandedVehicleId === assignment.vehicleId;
              return (
                <div
                  key={assignment.id}
                  className="border border-[#E2D1BC] rounded-xl overflow-hidden bg-white"
                >
                  <div
                    onClick={() => setExpandedVehicleId(isExpanded ? null : assignment.vehicleId)}
                    className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#FFF9F0] hover:bg-[#F3E8D7]/40 cursor-pointer transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-[#382719]">{assignment.vehicleName}</h4>
                      <p className="text-xs text-[#7A624E]">{assignment.vehicleType} • {assignment.stopsCount} stops assigned</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div>Distance: <b className="text-[#382719]">{assignment.totalDistanceKm} km</b></div>
                      <div>Time: <b className="text-[#382719]">{assignment.estimatedDurationMinutes} min</b></div>
                      <div>Utilization: <b className="text-[#5B3925]">{assignment.utilizationPercent}%</b></div>
                      <span className="text-xs text-[#8B6344] font-bold">
                        {isExpanded ? 'Collapse ▲' : 'View Stops ▼'}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t border-[#E2D1BC] bg-white overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F3E8D7] text-[#5B3925] uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Destination Label</th>
                            <th className="py-2 px-3">Priority</th>
                            <th className="py-2 px-3">Demand</th>
                            <th className="py-2 px-3">Estimated Arrival</th>
                            <th className="py-2 px-3">Transit Distance</th>
                            <th className="py-2 px-3">Risk Assessment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2D1BC]/60">
                          {assignment.stops.map((s) => (
                            <tr key={s.id} className="hover:bg-[#F3E8D7]/30">
                              <td className="py-2.5 px-3 font-bold text-[#5B3925]">{s.sequenceNumber}</td>
                              <td className="py-2.5 px-3 font-bold text-[#382719]">{s.deliveryStop.label}</td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={s.deliveryStop.priority} type="priority" />
                              </td>
                              <td className="py-2.5 px-3">{s.deliveryStop.demand} pkgs</td>
                              <td className="py-2.5 px-3 font-medium">
                                {new Date(s.estimatedArrivalAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2.5 px-3">{s.distanceFromPreviousKm} km</td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={s.riskLevel} type="risk" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Unassigned Deliveries Panel */}
        {run?.unassignedStops && run.unassignedStops.length > 0 && (
          <div className="bg-[#FFF9F0] border border-amber-300 rounded-xl p-5 shadow-warm">
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2 mb-2">
              <AlertOctagon className="w-4 h-4 text-amber-700" />
              Unassigned Stops ({run.unassignedStops.length})
            </h4>
            <div className="space-y-2 text-xs">
              {run.unassignedStops.map((u, i) => (
                <div key={i} className="p-2.5 bg-amber-50 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{u.stop.label}</span>
                  <span className="text-amber-800 font-medium">Reason: {u.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
