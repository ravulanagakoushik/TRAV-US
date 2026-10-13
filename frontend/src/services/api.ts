import axios from 'axios';
import {
  Vehicle,
  DeliveryStop,
  OptimizationRun,
  DisruptionScenario,
  AIAdvisory,
  DashboardSummary,
  OptimizationObjective,
} from '../types/index.js';

const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const cleanBase = rawBase.replace(/\/+$/, '');
const API_BASE_URL = cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 2500, // Responsive 2.5-second timeout for quick fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach demo token or Supabase bearer token if stored
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('routerescue_token') || 'demo-token-operator-01';
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Automatic Failover: If remote Render URL times out or is offline, seamlessly try local backend
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      originalRequest &&
      !originalRequest._retried &&
      (originalRequest.baseURL?.includes('onrender.com') || originalRequest.url?.includes('onrender.com')) &&
      (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error') || !error.response)
    ) {
      originalRequest._retried = true;
      originalRequest.baseURL = 'http://localhost:4000/api';
      console.warn('[API Client] Remote Render request failed/timed out. Retrying on local backend http://localhost:4000/api');
      try {
        return await axios({
          ...originalRequest,
          baseURL: 'http://localhost:4000/api',
          timeout: 4000,
        });
      } catch (fallbackErr) {
        return Promise.reject(fallbackErr);
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get('/dashboard/summary');
    return res.data.summary;
  },

  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const res = await apiClient.get('/vehicles');
    return res.data.vehicles;
  },
  createVehicle: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    const res = await apiClient.post('/vehicles', data);
    return res.data.vehicle;
  },
  updateVehicle: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    const res = await apiClient.patch(`/vehicles/${id}`, data);
    return res.data.vehicle;
  },
  deleteVehicle: async (id: string): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  },

  // Stops
  getStops: async (): Promise<DeliveryStop[]> => {
    const res = await apiClient.get('/stops');
    return res.data.stops;
  },
  createStop: async (data: Partial<DeliveryStop>): Promise<DeliveryStop> => {
    const res = await apiClient.post('/stops', data);
    return res.data.stop;
  },
  updateStop: async (id: string, data: Partial<DeliveryStop>): Promise<DeliveryStop> => {
    const res = await apiClient.patch(`/stops/${id}`, data);
    return res.data.stop;
  },
  deleteStop: async (id: string): Promise<void> => {
    await apiClient.delete(`/stops/${id}`);
  },

  // Optimization
  previewOptimization: async (options: {
    objective: OptimizationObjective;
    balanceWorkload?: boolean;
    prioritizeUrgent?: boolean;
    vehicleIds?: string[];
    stopIds?: string[];
  }) => {
    const res = await apiClient.post('/optimization/preview', options);
    return res.data.preview;
  },
  runOptimization: async (options: {
    objective: OptimizationObjective;
    balanceWorkload?: boolean;
    prioritizeUrgent?: boolean;
    vehicleIds?: string[];
    stopIds?: string[];
  }): Promise<OptimizationRun> => {
    const res = await apiClient.post('/optimization/runs', options);
    return res.data.run;
  },
  getOptimizationRuns: async (): Promise<OptimizationRun[]> => {
    const res = await apiClient.get('/optimization/runs');
    return res.data.runs;
  },
  getOptimizationRunById: async (id: string): Promise<OptimizationRun> => {
    const res = await apiClient.get(`/optimization/runs/${id}`);
    return res.data.run;
  },

  // Disruption Simulator
  createScenario: async (payload: {
    name: string;
    baselineRunId: string;
    scenarioType: 'traffic' | 'road_closure' | 'vehicle_breakdown' | 'urgent_delivery';
    configuration: any;
  }): Promise<{ scenario: DisruptionScenario; changedAssignments: any[] }> => {
    const res = await apiClient.post('/scenarios', payload);
    return res.data;
  },
  getScenarios: async (): Promise<DisruptionScenario[]> => {
    const res = await apiClient.get('/scenarios');
    return res.data.scenarios;
  },
  getScenarioById: async (id: string): Promise<DisruptionScenario> => {
    const res = await apiClient.get(`/scenarios/${id}`);
    return res.data.scenario;
  },

  // AI Advisor
  askAdvisor: async (payload: {
    question: string;
    taskType: string;
    runId?: string;
    scenarioId?: string;
  }): Promise<AIAdvisory> => {
    const res = await apiClient.post('/ai/advice', payload);
    return res.data.advisory;
  },
  getAdvisoryHistory: async (): Promise<AIAdvisory[]> => {
    const res = await apiClient.get('/ai/advice/history');
    return res.data.history;
  },

  // Customer Tracking
  trackDelivery: async (token: string) => {
    const res = await apiClient.get(`/tracking/${token}`);
    return res.data.tracking;
  },

  // Demo Seeding & Reset
  seedDemoData: async () => {
    const res = await apiClient.post('/demo/seed');
    return res.data;
  },
  resetDemoData: async () => {
    const res = await apiClient.post('/demo/reset');
    return res.data;
  },
};
