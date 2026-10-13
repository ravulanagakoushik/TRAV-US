import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchTracking = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.trackDelivery(token);
        setTracking(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Delivery parcel tracking reference not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F3E8D7] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#FFF9F0] border border-[#E2D1BC] rounded-2xl shadow-warm-lg overflow-hidden">
        {/* Brand Header */}
        <div className="bg-[#382416] p-6 text-[#FFF9F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-[#D4A373]" />
            <h1 className="font-bold text-lg tracking-tight">RouteRescue AI Tracking</h1>
          </div>
          <Link
            to="/dashboard"
            className="text-xs text-[#E2D1BC] hover:text-white flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Operations
          </Link>
        </div>

        {/* Tracking Body */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-12 text-[#7A624E] text-sm">
              Retrieving delivery transit status...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <b className="font-bold">Tracking Lookup Failed</b>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {tracking && (
            <div className="space-y-5">
              {/* Reference & Status */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E2D1BC]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A624E]">
                    Tracking Reference
                  </span>
                  <div className="font-mono font-bold text-base text-[#382719]">
                    {tracking.trackingNumber}
                  </div>
                </div>
                <StatusBadge status={tracking.status} />
              </div>

              {/* Destination */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A624E]">
                  Destination
                </span>
                <div className="font-bold text-sm text-[#382719] flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#A66B38]" />
                  <span>{tracking.destinationLabel}</span>
                </div>
              </div>

              {/* Estimated Arrival Window */}
              <div className="p-4 bg-[#F3E8D7] rounded-xl border border-[#E2D1BC]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5B3925] mb-1">
                  <Clock className="w-4 h-4 text-[#A66B38]" />
                  Estimated Delivery Window
                </div>
                <div className="text-xl font-black text-[#382719]">
                  {tracking.estimatedArrivalWindow.earliest} – {tracking.estimatedArrivalWindow.latest}
                </div>
                <div className="text-xs text-[#7A624E] mt-0.5">
                  Date: {tracking.estimatedArrivalWindow.date}
                </div>
              </div>

              {/* Delay or Notice banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{tracking.delayNotice}</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5 opacity-90">
                    {tracking.operationalNote}
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center text-[11px] text-[#A68A72] flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified End-to-End RouteRescue AI Dispatch Verification</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
