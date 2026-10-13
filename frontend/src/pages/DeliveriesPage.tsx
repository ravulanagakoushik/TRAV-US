import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { DeliveryStop, PriorityLevel } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Package, Plus, Trash2, Edit3, X, ExternalLink, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DeliveriesPage: React.FC = () => {
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<DeliveryStop | null>(null);

  // Form state
  const [label, setLabel] = useState('');
  const [demand, setDemand] = useState(4);
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [serviceDuration, setServiceDuration] = useState(8);
  const [deadlineMins, setDeadlineMins] = useState(120);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const navigate = useNavigate();

  const getSavedCustomStops = (): DeliveryStop[] => {
    try {
      const stored = localStorage.getItem('routerescue_custom_stops');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveCustomStops = (list: DeliveryStop[]) => {
    try {
      localStorage.setItem('routerescue_custom_stops', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save stops to localStorage', e);
    }
  };

  const loadStops = async () => {
    try {
      setLoading(true);
      const list = await api.getStops();
      const localStops = getSavedCustomStops();

      // Merge: backend list + any custom locally saved stops not yet in backend
      const existingIds = new Set((list || []).map((s) => s.id));
      const combined = [
        ...(list || []),
        ...localStops.filter((s) => !existingIds.has(s.id)),
      ];

      if (combined.length > 0) {
        setStops(combined);
      }
    } catch (err) {
      console.error('Failed to load stops', err);
      const localStops = getSavedCustomStops();
      if (localStops.length > 0) {
        setStops(localStops);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStops();
  }, []);

  const openCreateModal = () => {
    setEditingStop(null);
    setLabel('');
    setDemand(4);
    setPriority('normal');
    setServiceDuration(8);
    setDeadlineMins(120);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEditModal = (s: DeliveryStop) => {
    setEditingStop(s);
    setLabel(s.label);
    setDemand(s.demand);
    setPriority(s.priority);
    setServiceDuration(s.serviceDurationMinutes);
    setSaveError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const deadlineAt = new Date(Date.now() + Number(deadlineMins || 120) * 60000).toISOString();
    const lat = editingStop?.latitude ?? (37.775 + (Math.random() - 0.5) * 0.04);
    const lng = editingStop?.longitude ?? (-122.41 + (Math.random() - 0.5) * 0.05);
    const targetId = editingStop ? editingStop.id : `stop-${Date.now()}`;
    const token = editingStop?.trackingToken || `TRK-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const stopItem: DeliveryStop = {
      id: targetId,
      label: label.trim(),
      latitude: lat,
      longitude: lng,
      demand: Math.max(1, Number(demand) || 1),
      priority,
      serviceDurationMinutes: Math.max(1, Number(serviceDuration) || 5),
      deadlineAt,
      status: editingStop?.status || 'pending',
      trackingToken: token,
    };

    // 1. Immediately close modal and update table so user sees instant feedback!
    setModalOpen(false);
    setSaving(false);

    setStops((prev) => {
      const nextList = editingStop
        ? prev.map((s) => (s.id === targetId ? stopItem : s))
        : [stopItem, ...prev];
      saveCustomStops(nextList);
      return nextList;
    });

    // 2. Perform backend API sync in background
    try {
      if (editingStop) {
        await api.updateStop(editingStop.id, {
          label: label.trim(),
          demand: Math.max(1, Number(demand) || 1),
          priority,
          serviceDurationMinutes: Math.max(1, Number(serviceDuration) || 5),
        });
      } else {
        const created = await api.createStop({
          label: label.trim(),
          latitude: Math.round(lat * 10000) / 10000,
          longitude: Math.round(lng * 10000) / 10000,
          demand: Math.max(1, Number(demand) || 1),
          priority,
          serviceDurationMinutes: Math.max(1, Number(serviceDuration) || 5),
          deadlineAt,
          status: 'pending',
        });
        if (created?.id) {
          setStops((prev) => {
            const synced = prev.map((s) => (s.id === targetId ? created : s));
            saveCustomStops(synced);
            return synced;
          });
        }
      }
    } catch (err: any) {
      console.warn('API save background sync caught:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this delivery stop?')) return;
    setStops((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      saveCustomStops(remaining);
      return remaining;
    });
    try {
      await api.deleteStop(id);
    } catch (err) {
      console.warn('Backend delete deferred:', err);
    }
  };

  const filteredStops = stops.filter((s) => {
    if (filterPriority === 'all') return true;
    return s.priority === filterPriority;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Delivery Stops & Demands" onRefresh={loadStops} />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#382719] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#5B3925]" />
              Scheduled Delivery Stops ({filteredStops.length})
            </h2>
            <p className="text-xs text-[#7A624E]">
              Destination delivery requests, package payloads, and customer tracking tokens
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <div className="flex items-center gap-2 bg-[#FFF9F0] px-3 py-1.5 rounded-xl border border-[#E2D1BC] text-xs">
              <Filter className="w-3.5 h-3.5 text-[#7A624E]" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-transparent font-semibold text-[#382719] focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>

            <button
              onClick={openCreateModal}
              className="group px-4 py-2.5 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-lg hover:shadow-[#5B3925]/30 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
              <span>Add Delivery Stop</span>
            </button>
          </div>
        </div>

        {/* Deliveries Table Card */}
        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm card-hover-effect">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3E8D7] text-[#5B3925] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Destination Label</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Demand</th>
                  <th className="py-2.5 px-3">Dwell Duration</th>
                  <th className="py-2.5 px-3">Customer Tracking Ref</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D1BC]/60">
                {filteredStops.map((s) => (
                  <tr key={s.id} className="table-row-hover hover:scale-[1.002] transition-all duration-150 cursor-default">
                    <td className="py-3 px-3 font-bold text-[#382719] hover:text-[#5B3925] max-w-xs truncate transition-colors">
                      {s.label}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={s.priority} type="priority" />
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#5B3925]">{s.demand} pkgs</td>
                    <td className="py-3 px-3 text-[#7A624E]">{s.serviceDurationMinutes} mins</td>
                    <td className="py-3 px-3">
                      {s.trackingToken ? (
                        <button
                          onClick={() => navigate(`/track/${s.trackingToken}`)}
                          className="font-mono text-xs text-[#1565C0] hover:text-[#0D47A1] hover:scale-105 inline-flex items-center gap-1 font-semibold transition-transform duration-150"
                        >
                          <span>{s.trackingToken}</span>
                          <ExternalLink className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5" />
                        </button>
                      ) : (
                        <span className="text-[#7A624E]">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-[#5B3925] hover:bg-[#F3E8D7] rounded-lg hover:scale-125 active:scale-90 transition-all duration-150 shadow-none hover:shadow-sm"
                          title="Edit stop"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg hover:scale-125 active:scale-90 transition-all duration-150 shadow-none hover:shadow-sm"
                          title="Delete stop"
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
                  {editingStop ? 'Edit Delivery Stop' : 'Create Delivery Stop'}
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
                  <label className="font-semibold text-[#5B3925]">Destination Label</label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. St. Mary General Hospital"
                    className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#5B3925]">Package Demand</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={demand}
                      onChange={(e) => setDemand(parseInt(e.target.value, 10))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#5B3925]">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#5B3925]">Service Dwell (mins)</label>
                    <input
                      type="number"
                      min="1"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(parseInt(e.target.value, 10))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#5B3925]">Deadline Buffer (mins)</label>
                    <input
                      type="number"
                      min="10"
                      value={deadlineMins}
                      onChange={(e) => setDeadlineMins(parseInt(e.target.value, 10))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
                    />
                  </div>
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
                    {saving ? 'Saving Delivery...' : 'Save Delivery'}
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
