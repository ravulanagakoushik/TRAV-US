import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Vehicle } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Truck, Plus, Trash2, Edit3, X, Check } from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState('Electric Cargo Van');
  const [capacity, setCapacity] = useState(35);
  const [status, setStatus] = useState<Vehicle['status']>('available');
  const [cost, setCost] = useState(1.2);

  const [saving, setSaving] = useState(false);

  const getSavedCustomVehicles = (): Vehicle[] => {
    try {
      const stored = localStorage.getItem('routerescue_custom_vehicles');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveCustomVehicles = (list: Vehicle[]) => {
    try {
      localStorage.setItem('routerescue_custom_vehicles', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save vehicles to localStorage', e);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const list = await api.getVehicles();
      const localVehicles = getSavedCustomVehicles();

      const existingIds = new Set((list || []).map((v) => v.id));
      const combined = [
        ...(list || []),
        ...localVehicles.filter((v) => !existingIds.has(v.id)),
      ];

      if (combined.length > 0) {
        setVehicles(combined);
      }
    } catch (err) {
      console.error('Failed to load vehicles', err);
      const localVehicles = getSavedCustomVehicles();
      if (localVehicles.length > 0) {
        setVehicles(localVehicles);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const openCreateModal = () => {
    setEditingVehicle(null);
    setName('');
    setVehicleType('Electric Cargo Van');
    setCapacity(35);
    setStatus('available');
    setCost(1.2);
    setModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setName(v.name);
    setVehicleType(v.vehicleType);
    setCapacity(v.capacity);
    setStatus(v.status);
    setCost(v.operatingCostPerKm || 1.2);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const targetId = editingVehicle ? editingVehicle.id : `veh-${Date.now()}`;
    const vehicleItem: Vehicle = {
      id: targetId,
      userId: editingVehicle?.userId || 'demo-fleet-operator-01',
      name: name.trim(),
      vehicleType,
      capacity: Number(capacity) || 30,
      latitude: editingVehicle?.latitude ?? 37.778,
      longitude: editingVehicle?.longitude ?? -122.4075,
      status,
      operatingCostPerKm: Number(cost) || 1.0,
      createdAt: editingVehicle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately close modal and update state for instant user feedback!
    setModalOpen(false);
    setSaving(false);

    setVehicles((prev) => {
      const nextList = editingVehicle
        ? prev.map((v) => (v.id === targetId ? vehicleItem : v))
        : [vehicleItem, ...prev];
      saveCustomVehicles(nextList);
      return nextList;
    });

    // 2. Perform backend API sync in background
    try {
      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, {
          name: name.trim(),
          vehicleType,
          capacity: Number(capacity) || 30,
          status,
          operatingCostPerKm: Number(cost) || 1.0,
        });
      } else {
        const created = await api.createVehicle({
          name: name.trim(),
          vehicleType,
          capacity: Number(capacity) || 30,
          latitude: 37.778,
          longitude: -122.4075,
          status,
          operatingCostPerKm: Number(cost) || 1.0,
        });
        if (created?.id) {
          setVehicles((prev) => {
            const synced = prev.map((v) => (v.id === targetId ? created : v));
            saveCustomVehicles(synced);
            return synced;
          });
        }
      }
    } catch (err: any) {
      console.warn('API save background sync caught:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this vehicle from fleet?')) return;
    setVehicles((prev) => {
      const remaining = prev.filter((v) => v.id !== id);
      saveCustomVehicles(remaining);
      return remaining;
    });
    try {
      await api.deleteVehicle(id);
    } catch (err) {
      console.warn('Backend delete deferred:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Fleet Vehicle Management" onRefresh={loadVehicles} />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#382719] flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#5B3925]" />
              Active Fleet Manifest ({vehicles.length})
            </h2>
            <p className="text-xs text-[#7A624E]">
              Manage vehicle capacity payloads, operating costs, and availability constraints
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="group px-4 py-2.5 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-lg hover:shadow-[#5B3925]/30 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            <span>Add Vehicle</span>
          </button>
        </div>

        {/* Vehicles Table Card */}
        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm card-hover-effect">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3E8D7] text-[#5B3925] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Name</th>
                  <th className="py-2.5 px-3">Vehicle Type</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Operating Cost</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D1BC]/60">
                {vehicles.map((v) => (
                  <tr key={v.id} className="table-row-hover hover:scale-[1.002] transition-all duration-150 cursor-default">
                    <td className="py-3 px-3 font-bold text-[#382719] hover:text-[#5B3925] transition-colors">{v.name}</td>
                    <td className="py-3 px-3 text-[#7A624E]">{v.vehicleType}</td>
                    <td className="py-3 px-3 font-semibold text-[#5B3925]">{v.capacity} units</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-3 px-3">${v.operatingCostPerKm ?? 1.25} / km</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-1.5 text-[#5B3925] hover:bg-[#F3E8D7] rounded-lg hover:scale-125 active:scale-90 transition-all duration-150 shadow-none hover:shadow-sm"
                          title="Edit vehicle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg hover:scale-125 active:scale-90 transition-all duration-150 shadow-none hover:shadow-sm"
                          title="Delete vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-2xl w-full max-w-md p-6 shadow-warm-lg">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2D1BC]">
                <h3 className="font-bold text-base text-[#382719]">
                  {editingVehicle ? 'Edit Vehicle Details' : 'Add New Fleet Vehicle'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-[#7A624E] hover:text-[#382719]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-[#5B3925]">Vehicle Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. EcoTransit Van Alpha"
                    className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#5B3925]">Vehicle Type</label>
                  <input
                    type="text"
                    required
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    placeholder="e.g. Electric Cargo Van"
                    className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#5B3925]">Payload Capacity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#5B3925]">Operating Cost ($/km)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(parseFloat(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#5B3925]">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                  >
                    <option value="available">Available</option>
                    <option value="active">Active</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#E2D1BC]">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-[#F3E8D7] text-[#5B3925] rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving Vehicle...' : 'Save Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
