import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { DashboardSummary } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { MetricCard } from '../components/common/MetricCard.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Truck,
  Package,
  AlertTriangle,
  Percent,
  Leaf,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Fleet Operations Dashboard" onRefresh={loadData} />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner with What-If Simulator callout */}
        <div className="bg-gradient-to-r from-[#382416] to-[#5B3925] rounded-2xl p-6 text-[#FFF9F0] shadow-warm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A66B38]/50 text-xs font-semibold text-[#FFF9F0] mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Dynamic Dispatch Intelligence Active
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Predict the delay. Reroute the journey. Save time and resources.
            </h2>
            <p className="text-sm text-[#E2D1BC] mt-1 max-w-2xl">
              Deterministic road routing optimizer enforces hard vehicle capacity limits and urgent delivery deadlines while calculating live CO2 and fuel metrics.
            </p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/city')}
              className="px-4 py-2 bg-[#FFF9F0] text-[#382416] hover:bg-[#F3E8D7] rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Building2 className="w-4 h-4" />
              3D City View
            </button>
            <button
              onClick={() => navigate('/simulator')}
              className="px-4 py-2 bg-[#A66B38] text-white hover:bg-[#8B6344] rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              What-If Simulator
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Fleet"
            value={data?.kpis.totalVehicles ?? '--'}
            unit="vehicles"
            subtitle={`${data?.kpis.activeVehicles ?? 0} dispatched`}
            icon={Truck}
          />
          <MetricCard
            title="Delivery Demand"
            value={data?.kpis.totalStops ?? '--'}
            unit="stops"
            subtitle={`${data?.kpis.urgentStops ?? 0} urgent priority`}
            icon={Package}
          />
          <MetricCard
            title="At-Risk Deliveries"
            value={data?.kpis.atRiskDeliveries ?? 0}
            unit="stops"
            subtitle="Window SLA sensitivity"
            icon={AlertTriangle}
            trend={{
              value: data?.kpis.atRiskDeliveries === 0 ? 'Optimal' : 'Action Req',
              isPositive: data?.kpis.atRiskDeliveries === 0,
            }}
          />
          <MetricCard
            title="Fleet Utilization"
            value={data?.kpis.averageUtilization ?? 0}
            unit="%"
            subtitle="Payload capacity factor"
            icon={Percent}
          />
          <MetricCard
            title="CO₂ Emissions Saved"
            value={data?.kpis.co2SavedKg ?? 0}
            unit="kg"
            subtitle="vs. naive baseline dispatch"
            icon={Leaf}
            trend={{ value: '-18%', isPositive: true }}
          />
          <MetricCard
            title="Estimated Cost Saved"
            value={`$${data?.kpis.costSavingsUsd ?? 0}`}
            subtitle="Route efficiency gain"
            icon={DollarSign}
            trend={{ value: 'Saved', isPositive: true }}
          />
        </div>

        {/* Workload and Route Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workload Distribution Chart */}
          <div className="lg:col-span-2 bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#382719] text-base">Vehicle Workload & Capacity Utilization</h3>
                <p className="text-xs text-[#7A624E]">Delivered package volume vs max vehicle payload</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-[#F3E8D7] text-[#5B3925] rounded-lg">
                Active Shifts
              </span>
            </div>

            <div className="h-64 w-full">
              {data?.vehicleWorkloads && data.vehicleWorkloads.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.vehicleWorkloads}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2D1BC" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#7A624E', fontSize: 11 }}
                      interval={0}
                      tickFormatter={(val) => val.split(' ')[0]}
                    />
                    <YAxis tick={{ fill: '#7A624E', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFF9F0',
                        borderColor: '#E2D1BC',
                        borderRadius: '8px',
                        color: '#382719',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="deliveredDemand" name="Delivered Pkgs" fill="#5B3925" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="capacity" name="Total Capacity" fill="#D4A373" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-[#7A624E]">
                  Loading workload distribution...
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Operational Alerts */}
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm flex flex-col">
            <h3 className="font-bold text-[#382719] text-base mb-1">Operational Alerts</h3>
            <p className="text-xs text-[#7A624E] mb-4">Constraint triggers and delay advisories</p>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {data?.alerts && data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs ${
                    alert.type === 'danger'
                      ? 'bg-[#FFEBEE] border-[#FFCDD2] text-[#B71C1C]'
                      : alert.type === 'warning'
                      ? 'bg-[#FEF3D6] border-[#FFE082] text-[#C67D0A]'
                      : 'bg-[#E3F2FD] border-[#BBDEFB] text-[#1565C0]'
                  }`}
                >
                  <div className="font-bold mb-0.5">{alert.title}</div>
                  <div className="opacity-90 leading-relaxed">{alert.message}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/advisor')}
              className="mt-4 w-full py-2 bg-[#F3E8D7] text-[#5B3925] hover:bg-[#E2D1BC] rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Ask AI Advisor for Mitigation Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Assigned Vehicles Table */}
        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#382719] text-base">Active Fleet Dispatch Status</h3>
              <p className="text-xs text-[#7A624E]">Current route performance metrics and utilization</p>
            </div>
            <button
              onClick={() => navigate('/optimization')}
              className="text-xs font-bold text-[#5B3925] hover:underline"
            >
              Run New Optimization &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3E8D7] text-[#5B3925] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Vehicle Unit</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Assigned Stops</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Utilization Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D1BC]/60">
                {data?.vehicleWorkloads && data.vehicleWorkloads.map((v) => (
                  <tr key={v.vehicleId} className="hover:bg-[#F3E8D7]/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#382719]">{v.name}</td>
                    <td className="py-3 px-3 text-[#7A624E]">{v.vehicleType}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status="active" />
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#382719]">{v.deliveredDemand}</span>
                      <span className="text-[#7A624E]"> / {v.capacity} pkgs</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#5B3925]">{v.stopsCount} stops</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-[#E2D1BC] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              v.utilizationPercent > 85
                                ? 'bg-amber-600'
                                : 'bg-[#5B3925]'
                            }`}
                            style={{ width: `${Math.min(100, v.utilizationPercent)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[#382719]">{v.utilizationPercent}%</span>
                      </div>
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
