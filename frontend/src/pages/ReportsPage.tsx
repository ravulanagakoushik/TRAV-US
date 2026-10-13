import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { OptimizationRun, Vehicle, DeliveryStop } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { FileSpreadsheet, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stops, setStops] = useState<DeliveryStop[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const r = await api.getOptimizationRuns();
        const v = await api.getVehicles();
        const s = await api.getStops();
        setRuns(r);
        setVehicles(v);
        setStops(s);
      } catch (e) {
        console.error('Failed to load reports data', e);
      }
    };
    loadData();
  }, []);

  // CSV Formula Sanitizer (Section 18.15)
  const sanitizeCsvValue = (val: any): string => {
    if (val === undefined || val === null) return '';
    let str = String(val).trim();
    // Protect against CSV formula injection
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportVehiclesCsv = () => {
    const headers = ['Vehicle ID', 'Name', 'Type', 'Payload Capacity', 'Status', 'Operating Cost Per Km'];
    const rows = vehicles.map((v) => [
      v.id,
      v.name,
      v.vehicleType,
      v.capacity,
      v.status,
      v.operatingCostPerKm ?? 1.25,
    ]);

    const csvContent = [headers.map(sanitizeCsvValue).join(','), ...rows.map((r) => r.map(sanitizeCsvValue).join(','))].join('\n');
    downloadCsv(csvContent, 'RouteRescue_Fleet_Vehicles.csv');
  };

  const exportStopsCsv = () => {
    const headers = ['Stop ID', 'Destination Label', 'Priority', 'Demand (pkgs)', 'Service Dwell (mins)', 'Status', 'Tracking Token'];
    const rows = stops.map((s) => [
      s.id,
      s.label,
      s.priority,
      s.demand,
      s.serviceDurationMinutes,
      s.status,
      s.trackingToken ?? '',
    ]);

    const csvContent = [headers.map(sanitizeCsvValue).join(','), ...rows.map((r) => r.map(sanitizeCsvValue).join(','))].join('\n');
    downloadCsv(csvContent, 'RouteRescue_Delivery_Stops.csv');
  };

  const exportDispatchCsv = () => {
    if (runs.length === 0) return;
    const latest = runs[0];
    const headers = ['Vehicle', 'Vehicle Type', 'Stop Sequence', 'Destination Label', 'Priority', 'Demand', 'Estimated Arrival', 'Transit Distance (km)'];
    const rows: any[] = [];

    for (const a of latest.assignments) {
      for (const s of a.stops) {
        rows.push([
          a.vehicleName,
          a.vehicleType,
          s.sequenceNumber,
          s.deliveryStop.label,
          s.deliveryStop.priority,
          s.deliveryStop.demand,
          s.estimatedArrivalAt,
          s.distanceFromPreviousKm,
        ]);
      }
    }

    const csvContent = [headers.map(sanitizeCsvValue).join(','), ...rows.map((r) => r.map(sanitizeCsvValue).join(','))].join('\n');
    downloadCsv(csvContent, 'RouteRescue_Dispatch_Manifest.csv');
  };

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Operational Reports & CSV Export" />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-bold text-[#382719] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#5B3925]" />
            Fleet Data & Manifest Exports
          </h2>
          <p className="text-xs text-[#7A624E]">
            Export verified dispatch data, vehicles, and delivery stop records formatted for logistics systems
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dispatch Manifest Export */}
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#F3E8D7] flex items-center justify-center text-[#5B3925] mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#382719]">Dispatch Route Manifest</h3>
              <p className="text-xs text-[#7A624E] mt-1">
                Full turn-by-turn stop sequence, vehicle assignments, arrival times, and transit distances.
              </p>
            </div>
            <button
              onClick={exportDispatchCsv}
              className="mt-5 w-full py-2.5 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Dispatch CSV</span>
            </button>
          </div>

          {/* Fleet Vehicles Export */}
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#F3E8D7] flex items-center justify-center text-[#5B3925] mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#382719]">Fleet Vehicles Registry</h3>
              <p className="text-xs text-[#7A624E] mt-1">
                Vehicle payloads, operational statuses, vehicle classifications, and operating cost rates.
              </p>
            </div>
            <button
              onClick={exportVehiclesCsv}
              className="mt-5 w-full py-2.5 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Vehicles CSV</span>
            </button>
          </div>

          {/* Delivery Stops Export */}
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#F3E8D7] flex items-center justify-center text-[#5B3925] mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#382719]">Delivery Demands Registry</h3>
              <p className="text-xs text-[#7A624E] mt-1">
                Delivery parcels, destination labels, demand weights, priority tiers, and tracking tokens.
              </p>
            </div>
            <button
              onClick={exportStopsCsv}
              className="mt-5 w-full py-2.5 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Stops CSV</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl text-xs text-[#7A624E] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            CSV exports are automatically sanitized against spreadsheet formula injection vulnerabilities (`=`, `+`, `-`, `@`).
          </span>
        </div>
      </div>
    </div>
  );
};
