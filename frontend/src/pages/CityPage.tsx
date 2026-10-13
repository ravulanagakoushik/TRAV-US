import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { OptimizationRun, Vehicle, DeliveryStop } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { CityScene } from '../components/city/CityScene.js';
import { Map2D } from '../components/map/Map2D.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Building2, Map, Truck, Navigation, Eye, Clock, ShieldAlert } from 'lucide-react';

export const CityPage: React.FC = () => {
  const [run, setRun] = useState<OptimizationRun | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'split'>('3d');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const runs = await api.getOptimizationRuns();
      if (runs.length > 0) {
        setRun(runs[0]);
      } else {
        // If no run exists, seed demo and retrieve
        const seeded = await api.seedDemoData();
        setRun(seeded.initialRun);
      }
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
  }, []);

  const selectedAssignment = run?.assignments.find((a) => a.vehicleId === selectedVehicleId);

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Interactive 3D Fleet City" onRefresh={loadData} />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Controls Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FFF9F0] p-4 rounded-xl border border-[#E2D1BC] shadow-warm">
          <div>
            <h2 className="text-lg font-bold text-[#382719] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#A66B38]" />
              Digital Twin & Route Geometry Visualizer
            </h2>
            <p className="text-xs text-[#7A624E]">
              Synchronized 3D procedural urban environment animating actual dispatch coordinates
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-[#F3E8D7] p-1 rounded-xl border border-[#E2D1BC] shadow-sm">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-[#5B3925] text-[#FFF9F0] shadow-sm'
                  : 'text-[#7A624E] hover:text-[#382719] hover:bg-white/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              3D View
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
          {/* Main Visualizer (3D or 2D or Split) */}
          <div className={`${viewMode === 'split' ? 'lg:col-span-3' : 'lg:col-span-3'} space-y-4`}>
            {viewMode === '3d' && (
              <CityScene
                stops={stops}
                assignments={run?.assignments || []}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
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
