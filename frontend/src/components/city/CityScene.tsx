import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { VehicleRouteAssignment, Depot, DeliveryStop } from '../../types/index.js';
import {
  Sun,
  Moon,
  Sunset,
  Camera,
  Play,
  Pause,
  FastForward,
  Navigation,
  Compass,
  Layers,
  MapPin,
  Eye,
} from 'lucide-react';

interface CitySceneProps {
  depot?: Depot;
  stops?: DeliveryStop[];
  assignments?: VehicleRouteAssignment[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicleId: string) => void;
}

// Convert geographic coordinates to 3D local city coordinates
function geoTo3D(
  lat: number,
  lng: number,
  centerLat = 37.778,
  centerLng = -122.4075,
  scale = 2200
): [number, number, number] {
  const x = (lng - centerLng) * scale;
  const z = -(lat - centerLat) * scale;
  return [x, 0, z];
}

// Generate realistic skyscraper window facade texture
function createFacadeTexture(seedIndex: number, isNight: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Facade base wall color
  const baseColors = ['#18202F', '#0F172A', '#1E293B', '#1C1917'];
  ctx.fillStyle = isNight ? baseColors[seedIndex % baseColors.length] : '#334155';
  ctx.fillRect(0, 0, 128, 256);

  // Window grid configuration
  const cols = 8;
  const rows = 18;
  const wWidth = 9;
  const wHeight = 9;
  const gapX = 6;
  const gapY = 5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = 5 + c * (wWidth + gapX);
      const y = 6 + r * (wHeight + gapY);

      const p = Math.sin(r * 41.7 + c * 17.3 + seedIndex * 93.1);
      if (isNight) {
        if (p > 0.45) {
          ctx.fillStyle = p > 0.8 ? '#FEF08A' : p > 0.65 ? '#67E8F9' : '#FDE68A';
        } else {
          ctx.fillStyle = '#090D16';
        }
      } else {
        ctx.fillStyle = p > 0.2 ? '#93C5FD' : '#64748B';
      }
      ctx.fillRect(x, y, wWidth, wHeight);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Procedural City Buildings with Architectural Variety & Rooftop Infrastructure
const CityBuildings: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const textures = useMemo(() => {
    return [
      createFacadeTexture(0, isNight),
      createFacadeTexture(1, isNight),
      createFacadeTexture(2, isNight),
      createFacadeTexture(3, isNight),
    ];
  }, [isNight]);

  const buildings = useMemo(() => {
    const list = [];
    const gridSize = 8;
    const spacing = 19;

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        // Leave central plaza open for the distribution depot and main arteries
        if (Math.abs(i) <= 1 && Math.abs(j) <= 1) continue;
        if (i === 0 || j === 0) continue; // main thoroughfare avenues

        const seed = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        // Turn some blocks into urban parks with greenery
        const isPark = rand < 0.22 && (Math.abs(i) > 2 || Math.abs(j) > 2);

        if (isPark) {
          list.push({
            id: `park-${i}-${j}`,
            isPark: true,
            x: i * spacing,
            z: j * spacing,
            width: 14,
            depth: 14,
          });
        } else if (rand > 0.3) {
          const height = 8 + rand * 32;
          const width = 8 + (rand * 5);
          const depth = 8 + ((1 - rand) * 5);
          const x = i * spacing;
          const z = j * spacing;
          const textureIndex = Math.floor(rand * textures.length);
          const hasBeacon = height > 24;

          list.push({
            id: `b-${i}-${j}`,
            isPark: false,
            x,
            z,
            width,
            height,
            depth,
            textureIndex,
            hasBeacon,
          });
        }
      }
    }
    return list;
  }, [textures.length]);

  return (
    <group>
      {buildings.map((b) => {
        if (b.isPark) {
          return (
            <group key={b.id} position={[b.x, 0.05, b.z]}>
              {/* Park Lawn */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[b.width, b.depth]} />
                <meshStandardMaterial color={isNight ? '#143823' : '#22C55E'} roughness={0.9} />
              </mesh>
              {/* Park Trees */}
              {[
                [-3, -3],
                [3, -3],
                [-3, 3],
                [3, 3],
                [0, 0],
              ].map(([tx, tz], ti) => (
                <group key={ti} position={[tx, 0, tz]}>
                  {/* Trunk */}
                  <mesh position={[0, 0.75, 0]}>
                    <cylinderGeometry args={[0.2, 0.3, 1.5, 6]} />
                    <meshStandardMaterial color="#451A03" roughness={0.9} />
                  </mesh>
                  {/* Foliage */}
                  <mesh position={[0, 2.2, 0]} castShadow>
                    <dodecahedronGeometry args={[1.1, 0]} />
                    <meshStandardMaterial color={isNight ? '#166534' : '#15803D'} roughness={0.8} />
                  </mesh>
                </group>
              ))}
            </group>
          );
        }

        const tex = textures[b.textureIndex || 0];

        return (
          <group key={b.id} position={[b.x, 0, b.z]}>
            {/* Main Skyscraper Body */}
            <mesh position={[0, (b.height || 10) / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[b.width, b.height, b.depth]} />
              <meshStandardMaterial
                map={tex}
                roughness={0.4}
                metalness={0.6}
                color={isNight ? '#FFFFFF' : '#CBD5E1'}
              />
            </mesh>

            {/* Rooftop Trim & HVAC Unit */}
            <mesh position={[0, (b.height || 10) + 0.6, 0]}>
              <boxGeometry args={[(b.width || 8) * 0.8, 1.2, (b.depth || 8) * 0.8]} />
              <meshStandardMaterial color="#0F172A" roughness={0.7} />
            </mesh>

            {/* Rooftop Aircraft Beacon for Skyscrapers */}
            {b.hasBeacon && (
              <group position={[0, (b.height || 10) + 2.5, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.1, 0.15, 3, 6]} />
                  <meshStandardMaterial color="#64748B" />
                </mesh>
                <mesh position={[0, 1.6, 0]}>
                  <sphereGeometry args={[0.35]} />
                  <meshStandardMaterial
                    color="#EF4444"
                    emissive="#EF4444"
                    emissiveIntensity={isNight ? 1.5 : 0.8}
                  />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

// Central Logistics Fulfillment Depot
const CentralDepotModel: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  return (
    <group position={[0, 0, 0]}>
      {/* Ground Concrete Apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color={isNight ? '#262626' : '#E2E8F0'} roughness={0.6} />
      </mesh>

      {/* Main Logistics Warehouse Building */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[22, 6, 20]} />
        <meshStandardMaterial color="#382416" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Roof Deck */}
      <mesh position={[0, 6.4, 0]}>
        <boxGeometry args={[20, 0.8, 18]} />
        <meshStandardMaterial color="#5B3925" />
      </mesh>

      {/* Roll-Up Loading Dock Bays */}
      {[-6, -2, 2, 6].map((x, i) => (
        <group key={i} position={[x, 1.5, 10.05]}>
          <mesh>
            <planeGeometry args={[2.8, 3]} />
            <meshStandardMaterial
              color="#A66B38"
              emissive={isNight ? '#A66B38' : '#000000'}
              emissiveIntensity={isNight ? 0.4 : 0}
            />
          </mesh>
          <mesh position={[0, 1.8, 0.1]}>
            <boxGeometry args={[2.8, 0.3, 0.1]} />
            <meshStandardMaterial color="#FEF08A" />
          </mesh>
        </group>
      ))}

      {/* Communications & GPS Command Tower */}
      <group position={[7, 9, -6]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.5, 6, 8]} />
          <meshStandardMaterial color="#D4A373" />
        </mesh>
        <mesh position={[0, 3.2, 0]}>
          <sphereGeometry args={[0.8]} />
          <meshStandardMaterial
            color="#22C55E"
            emissive="#22C55E"
            emissiveIntensity={isNight ? 1.8 : 0.8}
          />
        </mesh>
      </group>

      {/* Holographic Depot Label */}
      <Html position={[0, 9, 0]} center distanceFactor={140}>
        <div className="bg-[#382416]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#D4A373] text-[#FFF9F0] text-xs font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap pointer-events-none select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          RouteRescue Fulfillment Depot
        </div>
      </Html>
    </group>
  );
};

// Realistic Delivery Stop Waypoint Pin
const DeliveryStopPin: React.FC<{
  stop: DeliveryStop;
  position: [number, number, number];
  isNight: boolean;
}> = ({ stop, position, isNight }) => {
  const pinRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const isUrgent = stop.priority === 'urgent';
  const color = isUrgent ? '#EF4444' : stop.priority === 'high' ? '#F59E0B' : '#3B82F6';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pinRef.current) {
      pinRef.current.position.y = 2.5 + Math.sin(t * 3 + position[0]) * 0.4;
      pinRef.current.rotation.y = t * 1.5;
    }
    if (ringRef.current) {
      const scale = 1 + (Math.sin(t * 2 + position[2]) + 1) * 0.3;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Ground Pulsing Target Ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.12, 0]}
      >
        <ringGeometry args={[1.2, 1.6, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isNight ? 0.7 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical Holographic Light Beam */}
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.08, 0.3, 8, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isNight ? 0.45 : 0.25}
        />
      </mesh>

      {/* Floating Rotating Waypoint Diamond */}
      <group ref={pinRef}>
        <mesh castShadow>
          <octahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isNight ? 0.8 : 0.4}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
};

// Detailed 3D Delivery Van Model
const RealisticDeliveryVan: React.FC<{
  assignment: VehicleRouteAssignment;
  isSelected: boolean;
  color: string;
  speedMultiplier: number;
  isNight: boolean;
  onSelect: () => void;
  onUpdatePosition?: (pos: THREE.Vector3, heading: number) => void;
}> = ({
  assignment,
  isSelected,
  color,
  speedMultiplier,
  isNight,
  onSelect,
  onUpdatePosition,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  const points = useMemo(() => {
    if (!assignment.routeGeometry || assignment.routeGeometry.length === 0) return [];
    return assignment.routeGeometry.map((g) => geoTo3D(g.latitude, g.longitude));
  }, [assignment.routeGeometry]);

  useFrame((_, delta) => {
    if (points.length < 2 || !meshRef.current) return;

    const baseSpeed = 0.05 * speedMultiplier;
    setProgress((prev) => (prev + delta * baseSpeed) % 1);

    const totalSegments = points.length - 1;
    const currentProgress = progress * totalSegments;
    const segIndex = Math.min(Math.floor(currentProgress), totalSegments - 1);
    const segT = currentProgress - segIndex;

    const pA = points[segIndex];
    const pB = points[segIndex + 1];

    const x = pA[0] + (pB[0] - pA[0]) * segT;
    const z = pA[2] + (pB[2] - pA[2]) * segT;

    meshRef.current.position.set(x, 0.8, z);

    // Compute heading direction with smooth rotation
    const dx = pB[0] - pA[0];
    const dz = pB[2] - pA[2];
    let targetHeading = 0;
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      targetHeading = Math.atan2(dx, dz);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetHeading,
        0.2
      );
    }

    if (isSelected && onUpdatePosition) {
      onUpdatePosition(new THREE.Vector3(x, 1.2, z), targetHeading);
    }
  });

  if (points.length < 2) return null;

  return (
    <group ref={meshRef} onClick={onSelect}>
      {/* Vehicle Cargo Body */}
      <mesh position={[0, 1.1, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.8, 3.8]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.6}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : 0}
        />
      </mesh>

      {/* Driver Cabin */}
      <mesh position={[0, 0.85, 1.7]} castShadow>
        <boxGeometry args={[2.4, 1.3, 1.6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 1.1, 2.25]}>
        <boxGeometry args={[2.1, 0.7, 0.5]} />
        <meshStandardMaterial color="#0284C7" roughness={0.1} metalness={0.9} transparent opacity={0.8} />
      </mesh>

      {/* 4 Rubber Tires with Chrome Rims */}
      {[
        [-1.3, 0.35, 1.4],
        [1.3, 0.35, 1.4],
        [-1.3, 0.35, -1.3],
        [1.3, 0.35, -1.3],
      ].map(([wx, wy, wz], wi) => (
        <group key={wi} position={[wx, wy, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 0.35, 16]} />
            <meshStandardMaterial color="#0F172A" roughness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.37, 8]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Dual Forward Headlights & Road Light Beams */}
      <mesh position={[-0.8, 0.6, 2.5]}>
        <sphereGeometry args={[0.18]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#FEF08A"
          emissiveIntensity={isNight ? 2.5 : 1.0}
        />
      </mesh>
      <mesh position={[0.8, 0.6, 2.5]}>
        <sphereGeometry args={[0.18]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#FEF08A"
          emissiveIntensity={isNight ? 2.5 : 1.0}
        />
      </mesh>

      {/* Headlight Cones projecting forward on road */}
      {isNight && (
        <mesh position={[0, 0.4, 6]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[2.5, 8, 16]} />
          <meshBasicMaterial color="#FEF08A" transparent opacity={0.12} />
        </mesh>
      )}

      {/* Dual Red Brake Taillights */}
      <mesh position={[-0.9, 0.6, -2.12]}>
        <boxGeometry args={[0.35, 0.2, 0.1]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={isNight ? 2 : 1} />
      </mesh>
      <mesh position={[0.9, 0.6, -2.12]}>
        <boxGeometry args={[0.35, 0.2, 0.1]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={isNight ? 2 : 1} />
      </mesh>

      {/* Rooftop RouteRescue AI Antenna */}
      <mesh position={[0, 2.15, -0.4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 6]} />
        <meshStandardMaterial color="#E2E8F0" />
      </mesh>
      <mesh position={[0, 2.4, -0.4]}>
        <sphereGeometry args={[0.18]} />
        <meshStandardMaterial
          color={isSelected ? '#EF4444' : '#22C55E'}
          emissive={isSelected ? '#EF4444' : '#22C55E'}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Floating Vehicle Unit HUD Tag */}
      <Html position={[0, 3.2, 0]} center distanceFactor={120}>
        <div
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md transition-all whitespace-nowrap pointer-events-none select-none flex items-center gap-1 ${
            isSelected
              ? 'bg-[#B71C1C] text-white ring-2 ring-white scale-110'
              : 'bg-[#382416]/90 text-[#FFF9F0] border border-[#5B3925]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {assignment.vehicleName}
        </div>
      </Html>
    </group>
  );
};

// 3D Glowing Route Polyline with Animated Energy Pulse
const GlowingRoutePolyline: React.FC<{
  points: [number, number, number][];
  color: string;
  isSelected: boolean;
  isNight: boolean;
}> = ({ points, color, isSelected, isNight }) => {
  const lineObject = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(p[0], 0.35, p[2]));
    const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
    const material = new THREE.LineBasicMaterial({
      color: isSelected ? '#EF4444' : color,
      linewidth: isSelected ? 4 : 2,
      transparent: true,
      opacity: isSelected ? 1.0 : isNight ? 0.8 : 0.65,
    });
    return new THREE.Line(geometry, material);
  }, [points, color, isSelected, isNight]);

  return <primitive object={lineObject} />;
};

// Camera Controller for Free Orbit vs Cinematic Chase Cam
const CameraController: React.FC<{
  cameraMode: 'orbit' | 'chase' | 'tactical' | 'depot';
  targetPos: THREE.Vector3 | null;
  targetHeading: number;
}> = ({ cameraMode, targetPos, targetHeading }) => {
  const { camera } = useThree();

  useFrame(() => {
    if (cameraMode === 'chase' && targetPos) {
      // Smoothly place camera behind and slightly above the selected vehicle
      const dist = 24;
      const height = 14;
      const cx = targetPos.x - Math.sin(targetHeading) * dist;
      const cz = targetPos.z - Math.cos(targetHeading) * dist;
      const cy = targetPos.y + height;

      camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.08);
      camera.lookAt(targetPos.x, targetPos.y + 1, targetPos.z);
    } else if (cameraMode === 'tactical') {
      camera.position.lerp(new THREE.Vector3(0, 160, 0.1), 0.05);
      camera.lookAt(0, 0, 0);
    } else if (cameraMode === 'depot') {
      camera.position.lerp(new THREE.Vector3(30, 25, 35), 0.05);
      camera.lookAt(0, 3, 0);
    }
  });

  return null;
};

export const CityScene: React.FC<CitySceneProps> = ({
  depot = { label: 'Central Depot', latitude: 37.778, longitude: -122.4075 },
  stops = [],
  assignments = [],
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const colors = ['#A66B38', '#1565C0', '#2E7D32', '#7B1FA2', '#D97706'];

  // Scene Controls State
  const [timeMode, setTimeMode] = useState<'night' | 'sunset' | 'day'>('night');
  const [cameraMode, setCameraMode] = useState<'orbit' | 'chase' | 'tactical' | 'depot'>('orbit');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [paused, setPaused] = useState(false);

  // Active Vehicle Tracking Coordinates for Chase Cam
  const [activeVehiclePos, setActiveVehiclePos] = useState<THREE.Vector3 | null>(null);
  const [activeVehicleHeading, setActiveVehicleHeading] = useState<number>(0);

  // If a vehicle is selected, default chase view to it if user toggles chase
  useEffect(() => {
    if (selectedVehicleId && cameraMode === 'chase') {
      // already in chase
    }
  }, [selectedVehicleId, cameraMode]);

  const isNight = timeMode === 'night';
  const isSunset = timeMode === 'sunset';

  // Extract all unique delivery stops from assignments if direct stops not passed
  const allStops = useMemo(() => {
    if (stops && stops.length > 0) return stops;
    return assignments.flatMap((a) => a.stops.map((s) => s.deliveryStop));
  }, [stops, assignments]);

  return (
    <div className="w-full h-[620px] bg-[#0F172A] rounded-2xl overflow-hidden border border-[#5B3925] shadow-warm-xl relative select-none">
      <Canvas
        camera={{ position: [85, 80, 95], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Sky Background & Atmospheric Fog */}
        <color
          attach="background"
          args={[isNight ? '#0B0F19' : isSunset ? '#2C1B18' : '#60A5FA']}
        />
        <fog
          attach="fog"
          args={[
            isNight ? '#0B0F19' : isSunset ? '#2C1B18' : '#93C5FD',
            60,
            260,
          ]}
        />

        {/* Dynamic Sun & Skylight */}
        <ambientLight intensity={isNight ? 0.35 : isSunset ? 0.7 : 0.9} />
        <hemisphereLight
          args={[
            isNight ? '#1E293B' : isSunset ? '#F97316' : '#BAE6FD',
            isNight ? '#0F172A' : '#78350F',
            isNight ? 0.4 : 0.8,
          ]}
        />

        <directionalLight
          position={isSunset ? [120, 45, 60] : [90, 130, 80]}
          intensity={isNight ? 0.9 : isSunset ? 1.8 : 1.4}
          color={isSunset ? '#FDBA74' : '#FFFFFF'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={320}
          shadow-camera-left={-110}
          shadow-camera-right={110}
          shadow-camera-top={110}
          shadow-camera-bottom={-110}
        />

        {/* Ambient Bounce Light */}
        <directionalLight
          position={[-70, 40, -50]}
          intensity={isNight ? 0.3 : 0.5}
          color="#A66B38"
        />

        {/* City Asphalt Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial
            color={isNight ? '#0F172A' : isSunset ? '#1E293B' : '#334155'}
            roughness={0.85}
          />
        </mesh>

        {/* Central Fulfillment Hub */}
        <CentralDepotModel isNight={isNight} />

        {/* Procedural City Skyline */}
        <CityBuildings isNight={isNight} />

        {/* Delivery Waypoint Markers */}
        {allStops.map((stop) => {
          const pos = geoTo3D(stop.latitude, stop.longitude);
          return (
            <DeliveryStopPin
              key={stop.id}
              stop={stop}
              position={pos}
              isNight={isNight}
            />
          );
        })}

        {/* Fleet Route Paths and Animated Vans */}
        {assignments.map((a, i) => {
          const color = colors[i % colors.length];
          const isSelected = selectedVehicleId === a.vehicleId;
          const points =
            a.routeGeometry?.map((g) => geoTo3D(g.latitude, g.longitude)) || [];

          return (
            <group key={a.id}>
              {points.length > 1 && (
                <GlowingRoutePolyline
                  points={points}
                  color={color}
                  isSelected={isSelected}
                  isNight={isNight}
                />
              )}
              <RealisticDeliveryVan
                assignment={a}
                isSelected={isSelected}
                color={color}
                speedMultiplier={paused ? 0 : speedMultiplier}
                isNight={isNight}
                onSelect={() => onSelectVehicle && onSelectVehicle(a.vehicleId)}
                onUpdatePosition={(pos, heading) => {
                  if (isSelected) {
                    setActiveVehiclePos(pos);
                    setActiveVehicleHeading(heading);
                  }
                }}
              />
            </group>
          );
        })}

        {/* Dynamic Camera Control Mode */}
        {cameraMode === 'orbit' && (
          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            maxPolarAngle={Math.PI / 2 - 0.04}
            minDistance={15}
            maxDistance={240}
          />
        )}

        <CameraController
          cameraMode={cameraMode}
          targetPos={activeVehiclePos}
          targetHeading={activeVehicleHeading}
        />
      </Canvas>

      {/* Top Left: Interactive Status HUD & Camera Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-[#1E293B]/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/80 text-white shadow-xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-tight text-slate-100">
              3D Smart City Digital Twin
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700" />

          {/* Time of Day Lighting Toggle */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setTimeMode('night')}
              className={`p-1.5 rounded-md transition-all ${
                timeMode === 'night'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Night / Neon Smart City View"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTimeMode('sunset')}
              className={`p-1.5 rounded-md transition-all ${
                timeMode === 'sunset'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Golden Hour Sunset"
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTimeMode('day')}
              className={`p-1.5 rounded-md transition-all ${
                timeMode === 'day'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Clear Daylight Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Camera Preset Toolbar */}
        <div className="bg-[#1E293B]/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 text-white shadow-xl flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider px-2 font-bold flex items-center gap-1">
            <Camera className="w-3 h-3 text-amber-400" /> Camera:
          </span>

          <button
            onClick={() => setCameraMode('orbit')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              cameraMode === 'orbit'
                ? 'bg-[#5B3925] text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Free Orbit
          </button>

          <button
            onClick={() => {
              if (!selectedVehicleId && assignments.length > 0) {
                if (onSelectVehicle) onSelectVehicle(assignments[0].vehicleId);
              }
              setCameraMode('chase');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              cameraMode === 'chase'
                ? 'bg-emerald-700 text-white shadow ring-1 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Smoothly track and follow the active delivery van"
          >
            <Navigation className="w-3 h-3 text-emerald-400 animate-spin" />
            Follow Van
          </button>

          <button
            onClick={() => setCameraMode('tactical')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              cameraMode === 'tactical'
                ? 'bg-[#5B3925] text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Top Tactical
          </button>

          <button
            onClick={() => setCameraMode('depot')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              cameraMode === 'depot'
                ? 'bg-[#5B3925] text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Hub Focus
          </button>
        </div>
      </div>

      {/* Top Right: Simulation Speed Multiplier Controls */}
      <div className="absolute top-4 right-4 bg-[#1E293B]/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 text-white shadow-xl flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setPaused(!paused)}
          className={`p-1.5 rounded-lg transition-all ${
            paused ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title={paused ? 'Resume fleet movement' : 'Pause fleet'}
        >
          {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        <div className="h-4 w-[1px] bg-slate-700" />

        <div className="flex items-center gap-1 text-xs font-bold">
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => {
                setSpeedMultiplier(spd);
                setPaused(false);
              }}
              className={`px-2 py-1 rounded-md transition-all ${
                speedMultiplier === spd && !paused
                  ? 'bg-[#5B3925] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Center: Fleet Telemetry & Instructions Overlay */}
      <div className="absolute bottom-4 inset-x-4 flex justify-between items-end pointer-events-none">
        <div className="bg-[#1E293B]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-white text-[11px] shadow-lg pointer-events-auto">
          <div className="font-semibold text-slate-300 flex items-center gap-2">
            <span>🖱️ Left Click + Drag: Orbit Camera</span>
            <span>•</span>
            <span>Scroll: Zoom In/Out</span>
            <span>•</span>
            <span>Right Click: Pan</span>
          </div>
        </div>

        {selectedVehicleId && (
          <div className="bg-[#1E293B]/95 backdrop-blur-md p-3.5 rounded-xl border border-emerald-500/50 text-white shadow-2xl flex items-center gap-4 pointer-events-auto animate-fadeIn">
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider block">
                Active Tracking Unit
              </span>
              <div className="font-extrabold text-sm text-white">
                {assignments.find((a) => a.vehicleId === selectedVehicleId)?.vehicleName || 'Fleet Unit'}
              </div>
            </div>

            <div className="h-7 w-[1px] bg-slate-700" />

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Assigned Deliveries</span>
              <span className="text-xs font-black text-amber-300">
                {assignments.find((a) => a.vehicleId === selectedVehicleId)?.stopsCount || 0} stops
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
