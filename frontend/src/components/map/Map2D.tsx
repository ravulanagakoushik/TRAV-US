import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { DeliveryStop, VehicleRouteAssignment, Depot } from '../../types/index.js';

interface Map2DProps {
  depot?: Depot;
  stops?: DeliveryStop[];
  assignments?: VehicleRouteAssignment[];
  selectedVehicleId?: string | null;
  onSelectStop?: (stop: DeliveryStop) => void;
  onSelectVehicle?: (vehicleId: string) => void;
  height?: string;
}

// Color palette for vehicle routes
const ROUTE_COLORS = [
  '#A66B38', // Amber Brown
  '#1565C0', // Blue
  '#2E7D32', // Green
  '#7B1FA2', // Purple
  '#C2185B', // Magenta
  '#E65100', // Deep Orange
  '#00838F', // Cyan
  '#4E342E', // Dark Brown
];

// Helper to create clean custom SVG DivIcons
const createStopIcon = (priority: string, seq?: number) => {
  let bgColor = '#1565C0';
  if (priority === 'urgent') bgColor = '#B71C1C';
  else if (priority === 'high') bgColor = '#C67D0A';
  else if (priority === 'low') bgColor = '#2E7D32';

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `<div style="background-color: ${bgColor}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${seq !== undefined ? seq : '•'}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const depotIcon = L.divIcon({
  className: 'custom-depot-marker',
  html: `<div style="background-color: #382416; color: #FFF9F0; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid #D4A373; box-shadow: 0 3px 8px rgba(0,0,0,0.4);">🏢</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export const Map2D: React.FC<Map2DProps> = ({
  depot = { label: 'Central Depot', latitude: 37.778, longitude: -122.4075 },
  stops = [],
  assignments = [],
  selectedVehicleId,
  onSelectStop,
  onSelectVehicle,
  height = '500px',
}) => {
  const centerLat = depot.latitude || 37.778;
  const centerLng = depot.longitude || -122.4075;

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-[#E2D1BC] shadow-warm relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Central Depot Marker */}
        <Marker position={[depot.latitude, depot.longitude]} icon={depotIcon}>
          <Popup>
            <div className="p-1">
              <h4 className="font-bold text-sm text-[#382416]">{depot.label}</h4>
              <p className="text-xs text-gray-600">Central Distribution Hub</p>
            </div>
          </Popup>
        </Marker>

        {/* Route Lines for each vehicle assignment */}
        {assignments.map((assignment, idx) => {
          if (!assignment.routeGeometry || assignment.routeGeometry.length === 0) return null;
          const isSelected = selectedVehicleId === assignment.vehicleId;
          const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
          const positions: [number, number][] = assignment.routeGeometry.map((g) => [
            g.latitude,
            g.longitude,
          ]);

          return (
            <Polyline
              key={assignment.id}
              positions={positions}
              pathOptions={{
                color: isSelected ? '#B71C1C' : color,
                weight: isSelected ? 5 : 3.5,
                opacity: selectedVehicleId && !isSelected ? 0.35 : 0.85,
                dashArray: isSelected ? undefined : '1, 0',
              }}
              eventHandlers={{
                click: () => onSelectVehicle && onSelectVehicle(assignment.vehicleId),
              }}
            >
              <Tooltip sticky>
                <div className="font-semibold text-xs">
                  {assignment.vehicleName} ({assignment.totalDistanceKm} km, {assignment.stopsCount} stops)
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Stops Markers */}
        {stops.map((stop) => {
          // Check if stop is in assignments to show sequence number
          let seqNumber: number | undefined;
          for (const a of assignments) {
            const found = a.stops.find((s) => s.deliveryStopId === stop.id);
            if (found) {
              seqNumber = found.sequenceNumber;
              break;
            }
          }

          return (
            <Marker
              key={stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={createStopIcon(stop.priority, seqNumber)}
              eventHandlers={{
                click: () => onSelectStop && onSelectStop(stop),
              }}
            >
              <Popup>
                <div className="p-1 max-w-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Stop #{seqNumber ?? 'Unassigned'}
                  </span>
                  <h4 className="font-bold text-sm text-gray-800 leading-snug mt-0.5">
                    {stop.label}
                  </h4>
                  <div className="mt-2 text-xs space-y-1 text-gray-600">
                    <div>Demand: <b>{stop.demand} pkgs</b></div>
                    <div>Priority: <b className="capitalize">{stop.priority}</b></div>
                    <div>Service Duration: <b>{stop.serviceDurationMinutes} mins</b></div>
                    {stop.deadlineAt && (
                      <div>Deadline: <b>{new Date(stop.deadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></div>
                    )}
                    {stop.trackingToken && (
                      <div className="pt-1 font-mono text-[11px] text-blue-600">
                        Ref: {stop.trackingToken}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
