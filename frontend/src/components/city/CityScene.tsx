import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { VehicleRouteAssignment, Depot, DeliveryStop } from '../../types/index.js';

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

// Procedural City Building Blocks
const CityBuildings: React.FC = () => {
  const buildings = useMemo(() => {
    const list = [];
    const gridSize = 8;
    const spacing = 18;

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        // Skip central plaza where depot sits
        if (Math.abs(i) <= 1 && Math.abs(j) <= 1) continue;

        // Random deterministic seed based on coordinate
        const seed = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        if (rand > 0.35) {
          const height = 4 + rand * 22;
          const width = 6 + (rand * 4);
          const depth = 6 + ((1 - rand) * 4);
          const x = i * spacing;
          const z = j * spacing;

          // Color in warm architectural tones
          const color = rand > 0.7 ? '#D4A373' : rand > 0.4 ? '#C4AC94' : '#E2D1BC';

          list.push({ id: `b-${i}-${j}`, x, z, width, height, depth, color });
        }
      }
    }
    return list;
  }, []);

  return (
    <group>
      {buildings.map((b) => (
        <mesh key={b.id} position={[b.x, b.height / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.width, b.height, b.depth]} />
          <meshStandardMaterial color={b.color} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
};

// Central Warehouse Depot Model
const CentralDepotModel: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Base Foundation */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 4, 16]} />
        <meshStandardMaterial color="#382416" roughness={0.4} />
      </mesh>
      {/* Roof Roofline */}
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[14, 1, 14]} />
        <meshStandardMaterial color="#8B6344" />
      </mesh>
      {/* Antenna / Beacon */}
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 4]} />
        <meshStandardMaterial color="#D4A373" />
      </mesh>
      <mesh position={[0, 9.2, 0]}>
        <sphereGeometry args={[0.6]} />
        <meshStandardMaterial color="#2E7D32" emissive="#2E7D32" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

// Animated Vehicle Token traveling continuously along calculated route polyline
const AnimatedVehicleToken: React.FC<{
  assignment: VehicleRouteAssignment;
  isSelected: boolean;
  color: string;
  onClick: () => void;
}> = ({ assignment, isSelected, color, onClick }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  // Convert route coordinates to 3D waypoints
  const points = useMemo(() => {
    if (!assignment.routeGeometry || assignment.routeGeometry.length === 0) return [];
    return assignment.routeGeometry.map((g) => geoTo3D(g.latitude, g.longitude));
  }, [assignment.routeGeometry]);

  useFrame((_, delta) => {
    if (points.length < 2 || !meshRef.current) return;

    // Advance vehicle position smoothly
    const speed = 0.08; // loop progression speed
    setProgress((prev) => (prev + delta * speed) % 1);

    const totalSegments = points.length - 1;
    const currentProgress = progress * totalSegments;
    const segIndex = Math.min(Math.floor(currentProgress), totalSegments - 1);
    const segT = currentProgress - segIndex;

    const pA = points[segIndex];
    const pB = points[segIndex + 1];

    const x = pA[0] + (pB[0] - pA[0]) * segT;
    const z = pA[2] + (pB[2] - pA[2]) * segT;

    meshRef.current.position.set(x, 1.2, z);

    // Orient vehicle towards forward movement direction
    const dx = pB[0] - pA[0];
    const dz = pB[2] - pA[2];
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      meshRef.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  if (points.length < 2) return null;

  return (
    <group ref={meshRef} onClick={onClick}>
      {/* Vehicle Body */}
      <mesh castShadow>
        <boxGeometry args={[2.4, 1.8, 4]} />
        <meshStandardMaterial
          color={isSelected ? '#B71C1C' : color}
          emissive={isSelected ? '#B71C1C' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.4, 1.2]}>
        <boxGeometry args={[2, 0.9, 1.2]} />
        <meshStandardMaterial color="#1F2937" roughness={0.1} />
      </mesh>
      {/* Headlights */}
      <mesh position={[0.7, -0.2, 2.05]}>
        <sphereGeometry args={[0.25]} />
        <meshStandardMaterial color="#FEF08A" emissive="#FEF08A" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.7, -0.2, 2.05]}>
        <sphereGeometry args={[0.25]} />
        <meshStandardMaterial color="#FEF08A" emissive="#FEF08A" emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

// 3D Path Polyline for vehicle routes
const RouteLine3D: React.FC<{ points: [number, number, number][]; color: string; isSelected: boolean }> = ({
  points,
  color,
  isSelected,
}) => {
  const lineObject = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(p[0], 0.25, p[2]));
    const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
    const material = new THREE.LineBasicMaterial({
      color: isSelected ? '#B71C1C' : color,
      linewidth: isSelected ? 4 : 2,
      transparent: true,
      opacity: isSelected ? 1.0 : 0.65,
    });
    return new THREE.Line(geometry, material);
  }, [points, color, isSelected]);

  return <primitive object={lineObject} />;
};

export const CityScene: React.FC<CitySceneProps> = ({
  depot = { label: 'Central Depot', latitude: 37.778, longitude: -122.4075 },
  assignments = [],
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const colors = ['#A66B38', '#1565C0', '#2E7D32', '#7B1FA2', '#E65100'];

  return (
    <div className="w-full h-[620px] bg-[#1C130D] rounded-xl overflow-hidden border border-[#5B3925] shadow-warm-lg relative">
      <Canvas
        camera={{ position: [80, 75, 95], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#24170F']} />
        
        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[100, 150, 80]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={350}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        <directionalLight position={[-80, 50, -60]} intensity={0.3} color="#D4A373" />

        {/* Ground Plane representing street layout */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#1C130D" roughness={0.9} />
        </mesh>

        {/* Central Fulfillment Depot */}
        <CentralDepotModel position={[0, 0, 0]} />

        {/* Procedural City Skyline */}
        <CityBuildings />

        {/* Vehicle Routes and Animated Vehicles */}
        {assignments.map((a, i) => {
          const color = colors[i % colors.length];
          const isSelected = selectedVehicleId === a.vehicleId;
          const points = a.routeGeometry?.map((g) => geoTo3D(g.latitude, g.longitude)) || [];

          return (
            <group key={a.id}>
              {points.length > 1 && (
                <RouteLine3D points={points} color={color} isSelected={isSelected} />
              )}
              <AnimatedVehicleToken
                assignment={a}
                isSelected={isSelected}
                color={color}
                onClick={() => onSelectVehicle && onSelectVehicle(a.vehicleId)}
              />
            </group>
          );
        })}

        {/* Orbit Camera Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={20}
          maxDistance={250}
        />
      </Canvas>

      {/* 3D Scene Interactive Overlay Controls */}
      <div className="absolute top-4 left-4 bg-[#382416]/90 backdrop-blur-md p-3 rounded-lg border border-[#5B3925] text-xs text-[#FFF9F0]">
        <div className="font-bold flex items-center gap-1.5 mb-1 text-[#D4A373]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Interactive 3D Fleet City
        </div>
        <p className="text-[#C4AC94] text-[11px]">
          Left-click + drag to orbit • Right-click to pan • Scroll to zoom
        </p>
      </div>
    </div>
  );
};
