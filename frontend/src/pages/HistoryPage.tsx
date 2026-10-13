import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { OptimizationRun } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { History, Route, Eye, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadRuns = async () => {
    try {
      setLoading(true);
      const list = await api.getOptimizationRuns();
      setRuns(list);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Optimization Run History" onRefresh={loadRuns} />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-bold text-[#382719] flex items-center gap-2">
            <History className="w-5 h-5 text-[#5B3925]" />
            Saved Optimization Runs ({runs.length})
          </h2>
          <p className="text-xs text-[#7A624E]">
            Inspect reproducible vehicle assignment runs, calculated metrics, and dispatch snapshots
          </p>
        </div>

        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3E8D7] text-[#5B3925] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Run Reference</th>
                  <th className="py-2.5 px-3">Objective</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Total Distance</th>
                  <th className="py-2.5 px-3">Total Travel Time</th>
                  <th className="py-2.5 px-3">Fleet Utilization</th>
                  <th className="py-2.5 px-3">At-Risk Stops</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D1BC]/60">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F3E8D7]/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#5B3925]">{r.id.substring(0, 15)}...</td>
                    <td className="py-3 px-3 font-semibold text-[#382719]">
                      {r.objective.replace(/_/g, ' ').toUpperCase()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-[#E2D1BC] text-[#382719] text-[10px] font-bold uppercase">
                        {r.calculationMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#382719]">
                      {r.optimizedMetrics.totalDistanceKm} km
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#382719]">
                      {r.optimizedMetrics.totalDurationMinutes} min
                    </td>
                    <td className="py-3 px-3 font-bold text-[#5B3925]">
                      {r.optimizedMetrics.averageUtilizationPercent}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          r.optimizedMetrics.atRiskDeliveriesCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {r.optimizedMetrics.atRiskDeliveriesCount} stops
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#7A624E]">
                      {new Date(r.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
