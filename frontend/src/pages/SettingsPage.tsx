import React, { useState } from 'react';
import { Topbar } from '../components/layout/Topbar.js';
import { Settings, Shield, User, Globe, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('Metro Logistics Fleet Director');
  const [defaultObjective, setDefaultObjective] = useState('balance_time_distance');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Dispatcher Settings" />

      <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-bold text-[#382719] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#5B3925]" />
            Operations Preferences & Configuration
          </h2>
          <p className="text-xs text-[#7A624E]">
            Operator profile, default heuristics, and system configuration
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-6 shadow-warm space-y-5">
          {saved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings saved successfully!
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#5B3925]">Operator Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-[#5B3925]">Default Optimization Objective</label>
              <select
                value={defaultObjective}
                onChange={(e) => setDefaultObjective(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-white border border-[#E2D1BC] rounded-lg text-xs"
              >
                <option value="balance_time_distance">Balanced Time & Distance</option>
                <option value="minimize_distance">Minimize Total Distance</option>
                <option value="prioritize_urgent">Prioritize Urgent Stops</option>
                <option value="balance_workload">Balance Fleet Workload</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#5B3925]">Distance Measurement Unit</label>
              <div className="flex gap-4 mt-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="unit"
                    value="km"
                    checked={distanceUnit === 'km'}
                    onChange={() => setDistanceUnit('km')}
                    className="accent-[#5B3925]"
                  />
                  <span>Kilometers (km)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="unit"
                    value="mi"
                    checked={distanceUnit === 'mi'}
                    onChange={() => setDistanceUnit('mi')}
                    className="accent-[#5B3925]"
                  />
                  <span>Miles (mi)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2D1BC] flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
