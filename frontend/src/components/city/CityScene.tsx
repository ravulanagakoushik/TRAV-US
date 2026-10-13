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
  Navigation,
  Compass,
  Radio,
  Layers,
  Activity,
  Crosshair,
  Building2,
  Eye,
} from 'lucide-react';

interface CitySceneProps {
  depot?: Depot;
  stops?: DeliveryStop[];
  assignments?: VehicleRouteAssignment[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicleId: string) => void;
  viewMode?: '3d' | 'satellite';
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

  const baseColors = ['#18202F', '#0F172A', '#1E293B', '#1C1917'];
  ctx.fillStyle = isNight ? baseColors[seedIndex % baseColors.length] : '#334155';
  ctx.fillRect(0, 0, 128, 256);

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

// Motion Graphics: Sweeping Orbital Satellite Laser Scanning Beam
const SatelliteScannerBeam: React.FC = () => {
  const beamRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const z = Math.sin(t * 0.75) * 115;
    if (beamRef.current) {
      beamRef.current.position.z = z;
    }
    if (glowRef.current) {
      glowRef.current.position.z = z;
    }
  });

  return (
    <group>
      {/* Sharp Laser Line */}
      <mesh ref={beamRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.45, 0]}>
        <planeGeometry args={[260, 2.5]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* Diffused Light Sweep Glow */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.42, 0]}>
        <planeGeometry args={[260, 16]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Motion Graphics: Disruption Hazard Zone Holographic Warning Rings
const DisruptionHazardZone: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = clock.getElapsedTime();
      const s = 1 + (Math.sin(t * 3) + 1) * 0.35;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
        <ringGeometry args={[14, 16.5, 32]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
        <circleGeometry args={[14, 32]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const CityBuildings: React.FC<{ isNight: boolean; isSunset: boolean; isSatellite: boolean }> = ({
  isNight,
  isSunset,
  isSatellite,
}) => {
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
        if (Math.abs(i) <= 1 && Math.abs(j) <= 1) continue;
        if (i === 0 || j === 0) continue;

        const seed = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);
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
          const width = 8 + rand * 5;
          const depth = 8 + (1 - rand) * 5;
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
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[b.width, b.depth]} />
                <meshStandardMaterial
                  color={isSatellite ? '#064E3B' : isNight ? '#143823' : '#22C55E'}
                  roughness={0.9}
                />
              </mesh>
              {[
                [-3, -3],
                [3, -3],
                [-3, 3],
                [3, 3],
                [0, 0],
              ].map(([tx, tz], ti) => (
                <group key={ti} position={[tx, 0, tz]}>
                  <mesh position={[0, 0.75, 0]}>
                    <cylinderGeometry args={[0.2, 0.3, 1.5, 6]} />
                    <meshStandardMaterial color="#451A03" roughness={0.9} />
                  </mesh>
                  <mesh position={[0, 2.2, 0]} castShadow>
                    <dodecahedronGeometry args={[1.1, 0]} />
                    <meshStandardMaterial
                      color={isSatellite ? '#047857' : isNight ? '#166534' : '#15803D'}
                      roughness={0.8}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          );
        }

        const tex = textures[b.textureIndex || 0];

        return (
          <group key={b.id} position={[b.x, 0, b.z]}>
            <mesh position={[0, (b.height || 10) / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[b.width, b.height, b.depth]} />
              <meshStandardMaterial
                map={isSatellite ? (isNight ? undefined : tex) : tex}
                color={
                  isSatellite
                    ? isNight
                      ? '#0F172A'
                      : isSunset
                      ? '#3D2E2B'
                      : '#64748B'
                    : isNight
                    ? '#FFFFFF'
                    : '#CBD5E1'
                }
                roughness={isSatellite ? (isNight ? 0.2 : 0.4) : 0.4}
                metalness={isSatellite ? (isNight ? 0.85 : 0.6) : 0.6}
                wireframe={false}
              />
            </mesh>

            {/* Satellite Grid Overlay on Rooftops */}
            {isSatellite && (
              <mesh position={[0, (b.height || 10) + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[(b.width || 8) * 0.9, (b.depth || 8) * 0.9]} />
                <meshBasicMaterial
                  color={isNight ? '#10B981' : isSunset ? '#F59E0B' : '#06B6D4'}
                  wireframe
                  transparent
                  opacity={0.4}
                />
              </mesh>
            )}

            <mesh position={[0, (b.height || 10) + 0.6, 0]}>
              <boxGeometry args={[(b.width || 8) * 0.8, 1.2, (b.depth || 8) * 0.8]} />
              <meshStandardMaterial color={isNight ? '#0F172A' : '#1E293B'} roughness={0.7} />
            </mesh>

            {b.hasBeacon && (
              <group position={[0, (b.height || 10) + 2.5, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.1, 0.15, 3, 6]} />
                  <meshStandardMaterial color="#64748B" />
                </mesh>
                <mesh position={[0, 1.6, 0]}>
                  <sphereGeometry args={[0.35]} />
                  <meshStandardMaterial
                    color={isSatellite ? '#10B981' : '#EF4444'}
                    emissive={isSatellite ? '#10B981' : '#EF4444'}
                    emissiveIntensity={isNight || isSatellite ? 2.0 : 0.8}
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
const CentralDepotModel: React.FC<{ isNight: boolean; isSatellite: boolean }> = ({ isNight, isSatellite }) => {
  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color={isSatellite ? '#0F172A' : isNight ? '#262626' : '#E2E8F0'} roughness={0.6} />
      </mesh>

      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[22, 6, 20]} />
        <meshStandardMaterial color="#382416" roughness={0.5} metalness={0.3} />
      </mesh>

      <mesh position={[0, 6.4, 0]}>
        <boxGeometry args={[20, 0.8, 18]} />
        <meshStandardMaterial color="#5B3925" />
      </mesh>

      {/* Dock Bays */}
      {[-6, -2, 2, 6].map((x, i) => (
        <group key={i} position={[x, 1.5, 10.05]}>
          <mesh>
            <planeGeometry args={[2.8, 3]} />
            <meshStandardMaterial
              color="#A66B38"
              emissive={isNight || isSatellite ? '#A66B38' : '#000000'}
              emissiveIntensity={isNight || isSatellite ? 0.4 : 0}
            />
          </mesh>
        </group>
      ))}

      {/* GPS Command Tower */}
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
            emissiveIntensity={isNight || isSatellite ? 2.0 : 0.8}
          />
        </mesh>
      </group>

      <Html position={[0, 9.5, 0]} center distanceFactor={140}>
        <div className="bg-[#1E293B]/95 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/60 text-[#FFF9F0] text-xs font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap pointer-events-none select-none font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          BASE LOGISTICS HUB // DEPOT-01
        </div>
      </Html>
    </group>
  );
};

// Delivery Stop Waypoint Pin
const DeliveryStopPin: React.FC<{
  stop: DeliveryStop;
  position: [number, number, number];
  isNight: boolean;
  isSatellite: boolean;
}> = ({ stop, position, isNight, isSatellite }) => {
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
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.12, 0]}
      >
        <ringGeometry args={[1.2, 1.6, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isNight || isSatellite ? 0.8 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.08, 0.3, 8, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isNight || isSatellite ? 0.5 : 0.25}
        />
      </mesh>

      <group ref={pinRef}>
        <mesh castShadow>
          <octahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isNight || isSatellite ? 1.0 : 0.4}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
};

// Realistic Delivery Van Model
const RealisticDeliveryVan: React.FC<{
  assignment: VehicleRouteAssignment;
  isSelected: boolean;
  color: string;
  speedMultiplier: number;
  isNight: boolean;
  isSatellite: boolean;
  onSelect: () => void;
  onUpdatePosition?: (pos: THREE.Vector3, heading: number) => void;
}> = ({
  assignment,
  isSelected,
  color,
  speedMultiplier,
  isNight,
  isSatellite,
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
          emissive={isSelected ? color : isSatellite ? '#064E3B' : '#000000'}
          emissiveIntensity={isSelected ? 0.4 : isSatellite ? 0.3 : 0}
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
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.37, 8]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Headlights */}
      <mesh position={[-0.8, 0.6, 2.5]}>
        <sphereGeometry args={[0.18]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#FEF08A"
          emissiveIntensity={isNight || isSatellite ? 2.5 : 1.0}
        />
      </mesh>
      <mesh position={[0.8, 0.6, 2.5]}>
        <sphereGeometry args={[0.18]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#FEF08A"
          emissiveIntensity={isNight || isSatellite ? 2.5 : 1.0}
        />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.9, 0.6, -2.12]}>
        <boxGeometry args={[0.35, 0.2, 0.1]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.9, 0.6, -2.12]}>
        <boxGeometry args={[0.35, 0.2, 0.1]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2} />
      </mesh>

      {/* Satellite Mode Motion Graphic: High-Tech Targeting Reticle */}
      {isSatellite ? (
        <Html position={[0, 3.6, 0]} center distanceFactor={110}>
          <div className="bg-slate-950/95 backdrop-blur-md px-2.5 py-1 rounded border border-emerald-500/80 text-emerald-400 font-mono text-[9px] shadow-2xl flex items-center gap-1.5 whitespace-nowrap pointer-events-none select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-black text-white">{assignment.vehicleName.split(' ')[0]}</span>
            <span>|</span>
            <span className="text-emerald-300">48 KM/H</span>
            <span>|</span>
            <span className="text-amber-400">{assignment.stopsCount} STOPS</span>
          </div>
        </Html>
      ) : (
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
      )}
    </group>
  );
};

// 3D Glowing Route Polyline
const GlowingRoutePolyline: React.FC<{
  points: [number, number, number][];
  color: string;
  isSelected: boolean;
  isNight: boolean;
  isSatellite: boolean;
}> = ({ points, color, isSelected, isNight, isSatellite }) => {
  const lineObject = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(p[0], 0.35, p[2]));
    const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
    const material = new THREE.LineBasicMaterial({
      color: isSelected ? '#EF4444' : isSatellite ? '#10B981' : color,
      linewidth: isSelected ? 4 : 2,
      transparent: true,
      opacity: isSelected ? 1.0 : isNight || isSatellite ? 0.85 : 0.65,
    });
    return new THREE.Line(geometry, material);
  }, [points, color, isSelected, isNight, isSatellite]);

  return <primitive object={lineObject} />;
};

// Camera Controller
const CameraController: React.FC<{
  cameraMode: 'orbit' | 'chase' | 'tactical' | 'depot';
  targetPos: THREE.Vector3 | null;
  targetHeading: number;
}> = ({ cameraMode, targetPos, targetHeading }) => {
  const { camera } = useThree();

  useFrame(() => {
    if (cameraMode === 'chase' && targetPos) {
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
  viewMode = '3d',
}) => {
  const colors = ['#A66B38', '#1565C0', '#2E7D32', '#7B1FA2', '#D97706'];

  // Scene Controls State
  const [internalMode, setInternalMode] = useState<'3d' | 'satellite'>(viewMode);
  const [timeMode, setTimeMode] = useState<'night' | 'sunset' | 'day'>('night');
  const [cameraMode, setCameraMode] = useState<'orbit' | 'chase' | 'tactical' | 'depot'>('orbit');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [paused, setPaused] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (viewMode) setInternalMode(viewMode);
  }, [viewMode]);

  const [activeVehiclePos, setActiveVehiclePos] = useState<THREE.Vector3 | null>(null);
  const [activeVehicleHeading, setActiveVehicleHeading] = useState<number>(0);

  const isSatellite = internalMode === 'satellite';
  const isNight = timeMode === 'night';
  const isSunset = timeMode === 'sunset';

  const allStops = useMemo(() => {
    if (stops && stops.length > 0) return stops;
    return assignments.flatMap((a) => a.stops.map((s) => s.deliveryStop));
  }, [stops, assignments]);

  // Check if there is an active disruption scenario in localStorage
  const activeScenarioStored = useMemo(() => {
    try {
      const stored = localStorage.getItem('routerescue_active_scenario');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="w-full h-[620px] bg-[#020617] rounded-2xl overflow-hidden border border-[#5B3925] shadow-warm-xl relative select-none">
      <Canvas
        camera={{ position: [85, 80, 95], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color
          attach="background"
          args={[
            isSatellite
              ? isNight
                ? '#020617'
                : isSunset
                ? '#241411'
                : '#0F1A2C'
              : isNight
              ? '#0B0F19'
              : isSunset
              ? '#2C1B18'
              : '#60A5FA',
          ]}
        />
        <fog
          attach="fog"
          args={[
            isSatellite
              ? isNight
                ? '#020617'
                : isSunset
                ? '#241411'
                : '#1E293B'
              : isNight
              ? '#0B0F19'
              : isSunset
              ? '#2C1B18'
              : '#93C5FD',
            60,
            260,
          ]}
        />

        {/* Dynamic Sun & Skylight */}
        <ambientLight
          intensity={
            isSatellite
              ? isNight
                ? 0.4
                : isSunset
                ? 0.7
                : 1.05
              : isNight
              ? 0.35
              : isSunset
              ? 0.7
              : 0.9
          }
        />
        <hemisphereLight
          args={[
            isSatellite
              ? isNight
                ? '#064E3B'
                : isSunset
                ? '#F97316'
                : '#38BDF8'
              : isNight
              ? '#1E293B'
              : isSunset
              ? '#F97316'
              : '#BAE6FD',
            isSatellite
              ? isNight
                ? '#020617'
                : isSunset
                ? '#1C1917'
                : '#0F172A'
              : isNight
              ? '#0F172A'
              : '#78350F',
            isSatellite ? (isNight ? 0.6 : isSunset ? 0.8 : 0.95) : (isNight ? 0.4 : 0.8),
          ]}
        />

        <directionalLight
          position={isSunset ? [120, 45, 60] : [90, 130, 80]}
          intensity={
            isSatellite
              ? isNight
                ? 1.1
                : isSunset
                ? 2.1
                : 2.3
              : isNight
              ? 0.9
              : isSunset
              ? 1.8
              : 1.4
          }
          color={isSunset ? '#FDBA74' : isSatellite ? (isNight ? '#34D399' : '#FFFFFF') : '#FFFFFF'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={320}
        />

        {/* City Asphalt Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial
            color={
              isSatellite
                ? isNight
                  ? '#020617'
                  : isSunset
                  ? '#1E1614'
                  : '#1E293B'
                : isNight
                ? '#0F172A'
                : isSunset
                ? '#1E293B'
                : '#334155'
            }
            roughness={0.85}
          />
        </mesh>

        {/* Satellite Mode: High-Tech Coordinate Grid Terrain */}
        {isSatellite && (
          <gridHelper
            args={[
              320,
              32,
              isNight ? '#059669' : isSunset ? '#F59E0B' : '#06B6D4',
              isNight ? '#064E3B' : isSunset ? '#78350F' : '#0E7490',
            ]}
            position={[0, 0.1, 0]}
          />
        )}

        {/* Satellite Mode: Sweeping Laser Scanner Beam */}
        {isSatellite && <SatelliteScannerBeam />}

        {/* Disruption Hazard Zones if scenario active */}
        {activeScenarioStored && (
          <DisruptionHazardZone position={[15, 0, -25]} />
        )}

        {/* Central Fulfillment Hub */}
        <CentralDepotModel isNight={isNight} isSatellite={isSatellite} />

        {/* Procedural City Skyline */}
        <CityBuildings isNight={isNight} isSunset={isSunset} isSatellite={isSatellite} />

        {/* Delivery Waypoint Markers */}
        {allStops.map((stop) => {
          const pos = geoTo3D(stop.latitude, stop.longitude);
          return (
            <DeliveryStopPin
              key={stop.id}
              stop={stop}
              position={pos}
              isNight={isNight}
              isSatellite={isSatellite}
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
                  isSatellite={isSatellite}
                />
              )}
              <RealisticDeliveryVan
                assignment={a}
                isSelected={isSelected}
                color={color}
                speedMultiplier={paused ? 0 : speedMultiplier}
                isNight={isNight}
                isSatellite={isSatellite}
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

        {/* Camera Control Mode */}
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

      {/* Satellite Mode: Real-Time Motion Graphics HUD Overlay */}
      {isSatellite && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Orbital Telemetry HUD */}
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md px-5 py-2 rounded-2xl border ${
            isNight
              ? 'border-emerald-500/60 text-emerald-400'
              : isSunset
              ? 'border-amber-500/60 text-amber-400'
              : 'border-cyan-400/70 text-cyan-300'
          } shadow-2xl flex items-center gap-4 font-mono text-xs`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                isNight ? 'bg-emerald-400' : isSunset ? 'bg-amber-400' : 'bg-cyan-400'
              } animate-ping`} />
              <span className="font-black text-white tracking-widest uppercase">
                {isNight
                  ? '🛰️ THERMAL INFRARED ORBITAL RECON // SAT-GEO-09 (IR-FLIR)'
                  : isSunset
                  ? '🌅 DUSK MULTI-SPECTRAL SATELLITE RECON // LOW SOLAR ANGLE'
                  : '☀️ OPTICAL DAYLIGHT SATELLITE RECON // SAT-GEO-09 (HIGH-RES VISIBLE)'}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700" />
            <div className="text-[11px] text-slate-300">
              LAT: 37.7780° N | LON: 122.4075° W | ALT: 412.5 KM
            </div>
            <div className="h-4 w-[1px] bg-slate-700" />
            <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${
              isNight
                ? 'text-emerald-300 bg-emerald-950/80 border-emerald-700/60'
                : isSunset
                ? 'text-amber-300 bg-amber-950/80 border-amber-700/60'
                : 'text-cyan-200 bg-cyan-950/80 border-cyan-700/60'
            }`}>
              {isNight ? 'SUB-METER THERMAL LOCKED' : isSunset ? 'SOLAR TERMINATOR MAPPED' : '100% OPTICAL CLARITY'}
            </span>
          </div>

          {/* Animated Tactical Corner Radar Display */}
          <div className={`absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border ${
            isNight
              ? 'border-emerald-500/60 text-emerald-400'
              : isSunset
              ? 'border-amber-500/60 text-amber-400'
              : 'border-cyan-400/70 text-cyan-300'
          } shadow-2xl flex flex-col items-center gap-1 font-mono text-[10px]`}>
            <div className={`relative w-16 h-16 rounded-full border ${
              isNight ? 'border-emerald-500/60' : isSunset ? 'border-amber-500/60' : 'border-cyan-400/60'
            } flex items-center justify-center overflow-hidden`}>
              <div className={`absolute inset-1 rounded-full border ${
                isNight ? 'border-emerald-500/30' : isSunset ? 'border-amber-500/30' : 'border-cyan-400/30'
              }`} />
              <div className="absolute inset-x-0 h-[1px] bg-white/20" />
              <div className="absolute inset-y-0 w-[1px] bg-white/20" />
              {/* Rotating radar sweep arm */}
              <div className={`absolute w-8 h-8 top-0 right-0 origin-bottom-left bg-gradient-to-tr from-transparent ${
                isNight ? 'to-emerald-400/50' : isSunset ? 'to-amber-400/50' : 'to-cyan-400/50'
              } animate-spin`} />
              <div className={`w-1.5 h-1.5 rounded-full ${
                isNight ? 'bg-emerald-400' : isSunset ? 'bg-amber-400' : 'bg-cyan-400'
              }`} />
            </div>
            <span className="font-bold text-slate-200 mt-1">RADAR AZ: 214°</span>
            <span className="text-[9px]">
              {isNight ? 'THERMAL • 6 TARGETS' : isSunset ? 'INFRARED • 6 TARGETS' : 'OPTICAL • 6 TARGETS'}
            </span>
          </div>

          {/* Corner Tactical Brackets */}
          <div className={`absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 ${
            isNight ? 'border-emerald-400' : isSunset ? 'border-amber-400' : 'border-cyan-400'
          } opacity-70`} />
          <div className={`absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 ${
            isNight ? 'border-emerald-400' : isSunset ? 'border-amber-400' : 'border-cyan-400'
          } opacity-70`} />
          <div className={`absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 ${
            isNight ? 'border-emerald-400' : isSunset ? 'border-amber-400' : 'border-cyan-400'
          } opacity-70`} />
        </div>
      )}

      {/* Top Left: Mode & Camera Toolbar */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto z-20">
        <div className="bg-[#1E293B]/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 text-white shadow-xl flex items-center gap-2">
          {/* 3D vs Satellite Mode Switcher */}
          <button
            onClick={() => setInternalMode('3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              !isSatellite
                ? 'bg-[#5B3925] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            3D City
          </button>
          <button
            onClick={() => setInternalMode('satellite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isSatellite
                ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-300" />
            Satellite View
          </button>

          <div className="h-4 w-[1px] bg-slate-700" />

          {/* Time of Day Lighting Toggle */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setTimeMode('night')}
              className={`p-1.5 rounded-md transition-all ${
                timeMode === 'night' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Night / Neon Smart City View"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTimeMode('sunset')}
              className={`p-1.5 rounded-md transition-all ${
                timeMode === 'sunset' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Golden Hour Sunset"
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTimeMode('day')}
              className={`p-1.5 rounded-md transition-all ${
                timeMode === 'day' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
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
              cameraMode === 'orbit' ? 'bg-[#5B3925] text-white shadow' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Orbit
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
            title="Follow active van"
          >
            <Navigation className="w-3 h-3 text-emerald-400" />
            Follow Van
          </button>

          <button
            onClick={() => setCameraMode('tactical')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              cameraMode === 'tactical' ? 'bg-[#5B3925] text-white shadow' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Top Down
          </button>

          <button
            onClick={() => setCameraMode('depot')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              cameraMode === 'depot' ? 'bg-[#5B3925] text-white shadow' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Hub Focus
          </button>
        </div>
      </div>

      {/* Top Right: Speed Multiplier Controls (only in 3D mode) */}
      {!isSatellite && (
        <div className="absolute top-4 right-4 bg-[#1E293B]/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 text-white shadow-xl flex items-center gap-2 pointer-events-auto z-20">
          <button
            onClick={() => setPaused(!paused)}
            className={`p-1.5 rounded-lg transition-all ${
              paused ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
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
      )}

      {/* Bottom Center: Fleet Telemetry */}
      <div className="absolute bottom-4 inset-x-4 flex justify-between items-end pointer-events-none z-20">
        <div className="bg-[#1E293B]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-white text-[11px] shadow-lg pointer-events-auto">
          <div className="font-semibold text-slate-300 flex items-center gap-2 font-mono">
            <span>🖱️ Left Click: Orbit</span>
            <span>•</span>
            <span>Scroll: Zoom</span>
            <span>•</span>
            <span>Right Click: Pan</span>
          </div>
        </div>

        {selectedVehicleId && (
          <div className="bg-[#1E293B]/95 backdrop-blur-md p-3.5 rounded-xl border border-emerald-500/50 text-white shadow-2xl flex items-center gap-4 pointer-events-auto animate-fadeIn font-mono">
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
              <span className="text-[10px] text-slate-400 block">Assigned Stops</span>
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
