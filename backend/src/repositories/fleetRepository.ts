import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import {
  Vehicle,
  DeliveryStop,
  OptimizationRun,
  DisruptionScenario,
  AIAdvisory,
  UserPreferences,
  UserProfile,
  Depot,
} from '../types/index.js';

// Default Central Logistics Hub coordinates (San Francisco Metro hub)
export const DEFAULT_DEPOT: Depot = {
  label: 'Central Metro Fulfillment Depot',
  latitude: 37.7780,
  longitude: -122.4075,
};

// Seed dataset generator for demo mode (5-8 vehicles, 15-25 stops)
export function createSeedData(userId: string): {
  vehicles: Vehicle[];
  stops: DeliveryStop[];
} {
  const vehicles: Vehicle[] = [
    {
      id: 'veh-01',
      userId,
      name: 'EcoTransit EV-Van Alpha',
      vehicleType: 'Electric Cargo Van',
      capacity: 35,
      latitude: 37.7780,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 0.95,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-02',
      userId,
      name: 'Sprinter Cargo Bravo',
      vehicleType: 'High-Roof Diesel Van',
      capacity: 45,
      latitude: 37.7780,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 1.45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-03',
      userId,
      name: 'Urban Express Charlie',
      vehicleType: 'Medium Transit Van',
      capacity: 30,
      latitude: 37.7780,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 1.15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-04',
      userId,
      name: 'ColdChain MedTrans Delta',
      vehicleType: 'Refrigerated Pharma Van',
      capacity: 25,
      latitude: 37.7780,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 1.75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-05',
      userId,
      name: 'Heavy Hauler Echo',
      vehicleType: 'Heavy Freight Box Truck',
      capacity: 70,
      latitude: 37.7780,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 2.30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-06',
      userId,
      name: 'Rapid Dispatch Fox',
      vehicleType: 'Compact City Van',
      capacity: 20,
      latitude: 37.7780,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 0.85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const now = Date.now();
  const stops: DeliveryStop[] = [
    {
      id: 'stop-01',
      userId,
      label: 'St. Mary General Hospital - Medical Supplies',
      latitude: 37.7758,
      longitude: -122.4532,
      demand: 6,
      priority: 'urgent',
      earliestServiceAt: new Date(now + 15 * 60000).toISOString(),
      deadlineAt: new Date(now + 90 * 60000).toISOString(),
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-MED-8491',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-02',
      userId,
      label: 'Financial Center Tower - Tech Hardware',
      latitude: 37.7923,
      longitude: -122.4001,
      demand: 8,
      priority: 'high',
      earliestServiceAt: new Date(now + 30 * 60000).toISOString(),
      deadlineAt: new Date(now + 150 * 60000).toISOString(),
      serviceDurationMinutes: 12,
      status: 'pending',
      trackingToken: 'TRK-FIN-3092',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-03',
      userId,
      label: 'Mission Arts District - Retail Apparel',
      latitude: 37.7599,
      longitude: -122.4187,
      demand: 5,
      priority: 'normal',
      earliestServiceAt: new Date(now + 45 * 60000).toISOString(),
      deadlineAt: new Date(now + 240 * 60000).toISOString(),
      serviceDurationMinutes: 8,
      status: 'pending',
      trackingToken: 'TRK-MIS-4712',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-04',
      userId,
      label: 'Fisherman Wharf Seafood Market',
      latitude: 37.8080,
      longitude: -122.4177,
      demand: 12,
      priority: 'high',
      earliestServiceAt: new Date(now + 30 * 60000).toISOString(),
      deadlineAt: new Date(now + 120 * 60000).toISOString(),
      serviceDurationMinutes: 15,
      status: 'pending',
      trackingToken: 'TRK-WHF-5830',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-05',
      userId,
      label: 'SoMa Software Campus - Server Components',
      latitude: 37.7812,
      longitude: -122.3980,
      demand: 7,
      priority: 'normal',
      earliestServiceAt: new Date(now + 20 * 60000).toISOString(),
      deadlineAt: new Date(now + 210 * 60000).toISOString(),
      serviceDurationMinutes: 6,
      status: 'pending',
      trackingToken: 'TRK-SOM-1029',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-06',
      userId,
      label: 'Civic Plaza Municipal Archives',
      latitude: 37.7792,
      longitude: -122.4191,
      demand: 4,
      priority: 'low',
      earliestServiceAt: new Date(now + 60 * 60000).toISOString(),
      deadlineAt: new Date(now + 300 * 60000).toISOString(),
      serviceDurationMinutes: 8,
      status: 'pending',
      trackingToken: 'TRK-CIV-9281',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-07',
      userId,
      label: 'Nob Hill Boutique Hotel - Linen Logistics',
      latitude: 37.7930,
      longitude: -122.4150,
      demand: 9,
      priority: 'normal',
      earliestServiceAt: new Date(now + 40 * 60000).toISOString(),
      deadlineAt: new Date(now + 240 * 60000).toISOString(),
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-NOB-6473',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-08',
      userId,
      label: 'Pacific Heights Residence - Luxury Consignment',
      latitude: 37.7925,
      longitude: -122.4350,
      demand: 3,
      priority: 'normal',
      earliestServiceAt: new Date(now + 50 * 60000).toISOString(),
      deadlineAt: new Date(now + 270 * 60000).toISOString(),
      serviceDurationMinutes: 5,
      status: 'pending',
      trackingToken: 'TRK-PAC-8302',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-09',
      userId,
      label: 'Embarcadero Ferry Terminal - Gourmet Provisions',
      latitude: 37.7955,
      longitude: -122.3937,
      demand: 11,
      priority: 'urgent',
      earliestServiceAt: new Date(now + 20 * 60000).toISOString(),
      deadlineAt: new Date(now + 80 * 60000).toISOString(),
      serviceDurationMinutes: 12,
      status: 'pending',
      trackingToken: 'TRK-FER-4920',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-10',
      userId,
      label: 'Mission Bay BioTech Research Labs',
      latitude: 37.7680,
      longitude: -122.3910,
      demand: 8,
      priority: 'high',
      earliestServiceAt: new Date(now + 35 * 60000).toISOString(),
      deadlineAt: new Date(now + 140 * 60000).toISOString(),
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-BIO-2291',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-11',
      userId,
      label: 'Castro District Organic Market',
      latitude: 37.7609,
      longitude: -122.4350,
      demand: 7,
      priority: 'normal',
      earliestServiceAt: new Date(now + 60 * 60000).toISOString(),
      deadlineAt: new Date(now + 260 * 60000).toISOString(),
      serviceDurationMinutes: 8,
      status: 'pending',
      trackingToken: 'TRK-CAS-7731',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-12',
      userId,
      label: 'Potrero Hill Artisan Workshop',
      latitude: 37.7580,
      longitude: -122.3990,
      demand: 4,
      priority: 'low',
      earliestServiceAt: new Date(now + 90 * 60000).toISOString(),
      deadlineAt: new Date(now + 320 * 60000).toISOString(),
      serviceDurationMinutes: 7,
      status: 'pending',
      trackingToken: 'TRK-POT-1184',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-13',
      userId,
      label: 'Chinatown Cultural Center - Goods Dispatch',
      latitude: 37.7941,
      longitude: -122.4078,
      demand: 6,
      priority: 'normal',
      earliestServiceAt: new Date(now + 30 * 60000).toISOString(),
      deadlineAt: new Date(now + 200 * 60000).toISOString(),
      serviceDurationMinutes: 9,
      status: 'pending',
      trackingToken: 'TRK-CHI-3829',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-14',
      userId,
      label: 'Sunset Commercial Corridor Bakery Chain',
      latitude: 37.7540,
      longitude: -122.4760,
      demand: 14,
      priority: 'high',
      earliestServiceAt: new Date(now + 40 * 60000).toISOString(),
      deadlineAt: new Date(now + 180 * 60000).toISOString(),
      serviceDurationMinutes: 14,
      status: 'pending',
      trackingToken: 'TRK-SUN-9942',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-15',
      userId,
      label: 'Richmond District Medical Clinic',
      latitude: 37.7790,
      longitude: -122.4780,
      demand: 5,
      priority: 'urgent',
      earliestServiceAt: new Date(now + 25 * 60000).toISOString(),
      deadlineAt: new Date(now + 105 * 60000).toISOString(),
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-RIC-6610',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-16',
      userId,
      label: 'Marina Green Waterside Bistro',
      latitude: 37.8040,
      longitude: -122.4380,
      demand: 8,
      priority: 'normal',
      earliestServiceAt: new Date(now + 50 * 60000).toISOString(),
      deadlineAt: new Date(now + 250 * 60000).toISOString(),
      serviceDurationMinutes: 8,
      status: 'pending',
      trackingToken: 'TRK-MAR-5021',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-17',
      userId,
      label: 'South Park Co-Working Hub',
      latitude: 37.7820,
      longitude: -122.3930,
      demand: 3,
      priority: 'low',
      earliestServiceAt: new Date(now + 75 * 60000).toISOString(),
      deadlineAt: new Date(now + 330 * 60000).toISOString(),
      serviceDurationMinutes: 5,
      status: 'pending',
      trackingToken: 'TRK-SPK-7840',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stop-18',
      userId,
      label: 'Dogpatch Industrial Machine Works',
      latitude: 37.7585,
      longitude: -122.3880,
      demand: 16,
      priority: 'normal',
      earliestServiceAt: new Date(now + 40 * 60000).toISOString(),
      deadlineAt: new Date(now + 220 * 60000).toISOString(),
      serviceDurationMinutes: 15,
      status: 'pending',
      trackingToken: 'TRK-DOG-3319',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return { vehicles, stops };
}

async function withTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T | null> {
  let timeoutHandle: any;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(null), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result as T;
  } catch {
    clearTimeout(timeoutHandle);
    return null;
  }
}

/**
 * Universal Fleet Repository with Supabase PostgreSQL and In-Memory Standalone Fallback.
 */
export class FleetRepository {
  private supabase: SupabaseClient | null = null;
  private inMemoryVehicles: Map<string, Vehicle[]> = new Map();
  private inMemoryStops: Map<string, DeliveryStop[]> = new Map();
  private inMemoryRuns: Map<string, OptimizationRun[]> = new Map();
  private inMemoryScenarios: Map<string, DisruptionScenario[]> = new Map();
  private inMemoryAdvisories: Map<string, AIAdvisory[]> = new Map();
  private inMemoryPreferences: Map<string, UserPreferences> = new Map();
  private inMemoryProfiles: Map<string, UserProfile> = new Map();

  constructor() {
    if (config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.includes('your-project')) {
      this.supabase = createClient(
        config.supabaseUrl,
        config.supabaseServiceRoleKey || config.supabaseAnonKey
      );
    }
  }

  public isSupabaseConnected(): boolean {
    return this.supabase !== null;
  }

  // Vehicles
  async getVehicles(userId: string): Promise<Vehicle[]> {
    if (this.supabase) {
      try {
        const res: any = await withTimeout(
          this.supabase.from('vehicles').select('*').eq('user_id', userId),
          2500
        );
        if (res && !res.error && res.data && res.data.length > 0) {
          return res.data.map(this.mapDbVehicle);
        }
      } catch {
        // Fall back to in-memory store
      }
    }
    this.ensureUserSeeded(userId);
    return this.inMemoryVehicles.get(userId) || [];
  }

  async getVehicleById(userId: string, id: string): Promise<Vehicle | null> {
    const list = await this.getVehicles(userId);
    return list.find((v) => v.id === id) || null;
  }

  async createVehicle(userId: string, item: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const newVehicle: Vehicle = {
      ...item,
      id: `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.supabase) {
      try {
        await withTimeout(
          this.supabase.from('vehicles').insert({
            id: newVehicle.id,
            user_id: userId,
            name: newVehicle.name,
            vehicle_type: newVehicle.vehicleType,
            capacity: newVehicle.capacity,
            latitude: newVehicle.latitude,
            longitude: newVehicle.longitude,
            status: newVehicle.status,
            operating_cost_per_km: newVehicle.operatingCostPerKm,
          }),
          2500
        );
      } catch {
        // Continue with memory store
      }
    }

    const current = await this.getVehicles(userId);
    this.inMemoryVehicles.set(userId, [...current, newVehicle]);
    return newVehicle;
  }

  async updateVehicle(userId: string, id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    const current = await this.getVehicles(userId);
    const idx = current.findIndex((v) => v.id === id);
    if (idx === -1) return null;

    const updated: Vehicle = {
      ...current[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    current[idx] = updated;
    this.inMemoryVehicles.set(userId, [...current]);

    if (this.supabase) {
      try {
        await withTimeout(
          this.supabase.from('vehicles').update({
            name: updated.name,
            vehicle_type: updated.vehicleType,
            capacity: updated.capacity,
            latitude: updated.latitude,
            longitude: updated.longitude,
            status: updated.status,
            operating_cost_per_km: updated.operatingCostPerKm,
          }).eq('id', id).eq('user_id', userId),
          2500
        );
      } catch {
        // Fall back to memory store
      }
    }

    return updated;
  }

  async deleteVehicle(userId: string, id: string): Promise<boolean> {
    const current = await this.getVehicles(userId);
    const filtered = current.filter((v) => v.id !== id);
    if (filtered.length === current.length) return false;

    this.inMemoryVehicles.set(userId, filtered);

    if (this.supabase) {
      try {
        await withTimeout(
          this.supabase.from('vehicles').delete().eq('id', id).eq('user_id', userId),
          2500
        );
      } catch {
        // Fall back to memory store
      }
    }
    return true;
  }

  // Delivery Stops
  async getStops(userId: string): Promise<DeliveryStop[]> {
    if (this.supabase) {
      try {
        const res: any = await withTimeout(
          this.supabase.from('delivery_stops').select('*').eq('user_id', userId),
          2500
        );
        if (res && !res.error && res.data && res.data.length > 0) {
          return res.data.map(this.mapDbStop);
        }
      } catch {
        // Fall back to memory store
      }
    }
    this.ensureUserSeeded(userId);
    return this.inMemoryStops.get(userId) || [];
  }

  async getStopById(userId: string, id: string): Promise<DeliveryStop | null> {
    const list = await this.getStops(userId);
    return list.find((s) => s.id === id) || null;
  }

  async getStopByTrackingToken(token: string): Promise<DeliveryStop | null> {
    for (const stops of this.inMemoryStops.values()) {
      const found = stops.find((s) => s.trackingToken === token);
      if (found) return found;
    }

    if (this.supabase) {
      try {
        const res: any = await withTimeout(
          this.supabase.from('delivery_stops').select('*').eq('tracking_token', token).single(),
          2500
        );
        if (res && res.data) return this.mapDbStop(res.data);
      } catch {
        // Fall back
      }
    }

    return null;
  }

  async createStop(userId: string, item: Omit<DeliveryStop, 'id' | 'userId' | 'trackingToken' | 'createdAt' | 'updatedAt'>): Promise<DeliveryStop> {
    const trackingToken = `TRK-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStop: DeliveryStop = {
      ...item,
      id: `stop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      trackingToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.supabase) {
      try {
        await withTimeout(
          this.supabase.from('delivery_stops').insert({
            id: newStop.id,
            user_id: userId,
            label: newStop.label,
            latitude: newStop.latitude,
            longitude: newStop.longitude,
            demand: newStop.demand,
            priority: newStop.priority,
            earliest_service_at: newStop.earliestServiceAt,
            deadline_at: newStop.deadlineAt,
            service_duration_minutes: newStop.serviceDurationMinutes,
            status: newStop.status,
            tracking_token: newStop.trackingToken,
          }),
          2500
        );
      } catch {
        // Fall back to memory store
      }
    }

    const current = await this.getStops(userId);
    this.inMemoryStops.set(userId, [...current, newStop]);
    return newStop;
  }

  async updateStop(userId: string, id: string, updates: Partial<DeliveryStop>): Promise<DeliveryStop | null> {
    const current = await this.getStops(userId);
    const idx = current.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const updated: DeliveryStop = {
      ...current[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    current[idx] = updated;
    this.inMemoryStops.set(userId, [...current]);

    if (this.supabase) {
      try {
        await withTimeout(
          this.supabase.from('delivery_stops').update({
            label: updated.label,
            latitude: updated.latitude,
            longitude: updated.longitude,
            demand: updated.demand,
            priority: updated.priority,
            earliest_service_at: updated.earliestServiceAt,
            deadline_at: updated.deadlineAt,
            service_duration_minutes: updated.serviceDurationMinutes,
            status: updated.status,
          }).eq('id', id).eq('user_id', userId),
          2500
        );
      } catch {
        // Fall back
      }
    }

    return updated;
  }

  async deleteStop(userId: string, id: string): Promise<boolean> {
    const current = await this.getStops(userId);
    const filtered = current.filter((s) => s.id !== id);
    if (filtered.length === current.length) return false;

    this.inMemoryStops.set(userId, filtered);

    if (this.supabase) {
      try {
        await withTimeout(
          this.supabase.from('delivery_stops').delete().eq('id', id).eq('user_id', userId),
          2500
        );
      } catch {
        // Fall back
      }
    }
    return true;
  }

  // Optimization Runs
  async getOptimizationRuns(userId: string): Promise<OptimizationRun[]> {
    return this.inMemoryRuns.get(userId) || [];
  }

  async getOptimizationRunById(userId: string, id: string): Promise<OptimizationRun | null> {
    const runs = await this.getOptimizationRuns(userId);
    return runs.find((r) => r.id === id) || null;
  }

  async saveOptimizationRun(userId: string, run: OptimizationRun): Promise<OptimizationRun> {
    const current = await this.getOptimizationRuns(userId);
    this.inMemoryRuns.set(userId, [run, ...current]);

    if (this.supabase) {
      await this.supabase.from('optimization_runs').insert({
        id: run.id,
        user_id: userId,
        objective: run.objective,
        calculation_mode: run.calculationMode,
        input_snapshot: run.inputSnapshot,
        baseline_metrics: run.baselineMetrics,
        optimized_metrics: run.optimizedMetrics,
        result_snapshot: { assignments: run.assignments, unassignedStops: run.unassignedStops },
        status: run.status,
      });
    }

    return run;
  }

  // Disruption Scenarios
  async getScenarios(userId: string): Promise<DisruptionScenario[]> {
    return this.inMemoryScenarios.get(userId) || [];
  }

  async getScenarioById(userId: string, id: string): Promise<DisruptionScenario | null> {
    const scenarios = await this.getScenarios(userId);
    return scenarios.find((s) => s.id === id) || null;
  }

  async saveScenario(userId: string, scenario: DisruptionScenario): Promise<DisruptionScenario> {
    const current = await this.getScenarios(userId);
    this.inMemoryScenarios.set(userId, [scenario, ...current]);
    return scenario;
  }

  // AI Advisories
  async getAdvisories(userId: string): Promise<AIAdvisory[]> {
    return this.inMemoryAdvisories.get(userId) || [];
  }

  async saveAdvisory(userId: string, advisory: AIAdvisory): Promise<AIAdvisory> {
    const current = await this.getAdvisories(userId);
    this.inMemoryAdvisories.set(userId, [advisory, ...current]);
    return advisory;
  }

  // User Profile & Preferences
  async getPreferences(userId: string): Promise<UserPreferences> {
    const existing = this.inMemoryPreferences.get(userId);
    if (existing) return existing;

    const def: UserPreferences = {
      userId,
      defaultObjective: 'balance_time_distance',
      distanceUnit: 'km',
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryPreferences.set(userId, def);
    return def;
  }

  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    this.inMemoryPreferences.set(userId, updated);
    return updated;
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const existing = this.inMemoryProfiles.get(userId);
    if (existing) return existing;

    const profile: UserProfile = {
      id: userId,
      displayName: 'Fleet Operations Director',
      email: 'dispatcher@routerescue.ai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryProfiles.set(userId, profile);
    return profile;
  }

  async updateProfile(userId: string, displayName: string): Promise<UserProfile> {
    const current = await this.getProfile(userId);
    const updated = { ...current, displayName, updatedAt: new Date().toISOString() };
    this.inMemoryProfiles.set(userId, updated);
    return updated;
  }

  // Demo Seeding and Reset
  public seedDemoData(userId: string): { vehicles: Vehicle[]; stops: DeliveryStop[] } {
    const { vehicles, stops } = createSeedData(userId);
    this.inMemoryVehicles.set(userId, vehicles);
    this.inMemoryStops.set(userId, stops);
    return { vehicles, stops };
  }

  public resetDemoData(userId: string): void {
    this.seedDemoData(userId);
    this.inMemoryRuns.set(userId, []);
    this.inMemoryScenarios.set(userId, []);
    this.inMemoryAdvisories.set(userId, []);
  }

  private ensureUserSeeded(userId: string) {
    if (!this.inMemoryVehicles.has(userId) || !this.inMemoryStops.has(userId)) {
      this.seedDemoData(userId);
    }
  }

  private mapDbVehicle(row: any): Vehicle {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      vehicleType: row.vehicle_type,
      capacity: Number(row.capacity),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      status: row.status,
      operatingCostPerKm: row.operating_cost_per_km ? Number(row.operating_cost_per_km) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapDbStop(row: any): DeliveryStop {
    return {
      id: row.id,
      userId: row.user_id,
      label: row.label,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      demand: Number(row.demand),
      priority: row.priority,
      earliestServiceAt: row.earliest_service_at,
      deadlineAt: row.deadline_at,
      serviceDurationMinutes: Number(row.service_duration_minutes),
      status: row.status,
      trackingToken: row.tracking_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const fleetRepository = new FleetRepository();
