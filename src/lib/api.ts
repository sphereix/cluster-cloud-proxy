import axios from 'axios';
import { authenticate } from './auth';

// Types
export interface Site {
  domain: string;
  status: 'active' | 'warning' | 'error';
  sslPassthrough: boolean;
  loadBalancing: LoadBalancingMode;
  backends: Backend[];
  metrics: Metrics;
  caching: CacheConfig;
  security: SecurityConfig;
  trafficLastHour: number;
}

export interface Backend {
  url: string;
  isBackup: boolean;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
}

export interface Metrics {
  requestsTotal: number;
  requestsPerSecond: number;
  avgResponseTime: number;
  bandwidthUsage: number;
  successRate: number;
  errorRate: number;
  clientErrors: number;
  serverErrors: number;
  cacheHitRate: number;
  lastHourStats: Array<{ timestamp: number; requests: number }>;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;        // Cache duration in seconds
  staleIfError: number; // Grace period in seconds
}

export type LoadBalancingMode = 'round_robin' | 'least_conn' | 'ip_hash' | 'failover';

export interface SecurityConfig {
  fail2ban: {
    enabled: boolean;
    maxRetries: number;
    findTime: number;
    banTime: number;
  };
  trafficSniffing: {
    enabled: boolean;
    logLevel: 'basic' | 'detailed' | 'full';
    captureHeaders: boolean;
    captureBodies: boolean;
  };
  rateLimit: {
    enabled: boolean;
    requestsPerSecond: number;
    burstSize: number;
  };
  waf: {
    enabled: boolean;
    rules: WafRule[];
  };
}

export interface WafRule {
  id: string;
  name: string;
  enabled: boolean;
  action: 'block' | 'log' | 'challenge';
}

export interface BackendConfig {
  consulUrl?: string;
  consulToken?: string;
  prometheusUrl?: string;
  prometheusUsername?: string;
  prometheusPassword?: string;
  nginxUrl?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  username: string;
  isAdmin: boolean;
}

// Demo mode state
let isDemo = false;
let sites: Site[] = [];

// Demo data generator
const generateDemoData = (): Site[] => [
  {
    domain: 'example.com',
    status: 'active',
    sslPassthrough: true,
    loadBalancing: 'round_robin',
    backends: [
      { url: 'backend1.example.com', isBackup: false, status: 'healthy', responseTime: 150 },
      { url: 'backend2.example.com', isBackup: true, status: 'healthy', responseTime: 180 }
    ],
    metrics: {
      requestsTotal: 15000,
      requestsPerSecond: 25.5,
      avgResponseTime: 150,
      bandwidthUsage: 1024,
      successRate: 99.5,
      errorRate: 0.005,
      clientErrors: 45,
      serverErrors: 12,
      cacheHitRate: 85.5,
      lastHourStats: Array.from({ length: 60 }, (_, i) => ({
        timestamp: Date.now() - (59 - i) * 60000,
        requests: Math.floor(Math.random() * 100) + 50
      }))
    },
    caching: {
      enabled: true,
      ttl: 3600,
      staleIfError: 300
    },
    security: {
      fail2ban: {
        enabled: true,
        maxRetries: 5,
        findTime: 300,
        banTime: 3600
      },
      trafficSniffing: {
        enabled: true,
        logLevel: 'basic',
        captureHeaders: true,
        captureBodies: false
      },
      rateLimit: {
        enabled: true,
        requestsPerSecond: 100,
        burstSize: 50
      },
      waf: {
        enabled: true,
        rules: [
          { id: 'sql-injection', name: 'SQL Injection Protection', enabled: true, action: 'block' },
          { id: 'xss', name: 'XSS Protection', enabled: true, action: 'block' },
          { id: 'file-inclusion', name: 'File Inclusion Protection', enabled: true, action: 'block' }
        ]
      }
    },
    trafficLastHour: 1500
  }
];

// API Functions
export const enableDemoMode = () => {
  isDemo = true;
  sites = generateDemoData();
};

export const disableDemoMode = () => {
  isDemo = false;
  sites = [];
};

export const isConfigured = () => {
  if (isDemo) return true;
  const config = getBackendConfig();
  return !!(config.consulUrl && config.prometheusUrl && config.nginxUrl);
};

export const getBackendConfig = (): BackendConfig => {
  if (isDemo) {
    return {
      consulUrl: 'http://localhost:8500',
      prometheusUrl: 'http://localhost:9090',
      nginxUrl: 'http://localhost:80'
    };
  }
  try {
    const stored = localStorage.getItem('backendConfig');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const setBackendConfig = async (config: BackendConfig): Promise<boolean> => {
  if (isDemo) return true;
  try {
    localStorage.setItem('backendConfig', JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
};

export const login = async (credentials: LoginCredentials): Promise<User | null> => {
  if (isDemo) {
    return { username: 'demo', isAdmin: true };
  }
  
  return authenticate(credentials);
};

export const getSites = async (): Promise<Site[]> => {
  if (isDemo) return sites;
  const response = await axios.get('/api/sites');
  return response.data;
};

export const addSite = async (
  domain: string,
  primary: string,
  backup: string,
  sslPassthrough: boolean
): Promise<void> => {
  if (isDemo) {
    const newSite: Site = {
      domain,
      status: 'active',
      sslPassthrough,
      loadBalancing: 'round_robin',
      backends: [
        { url: primary, isBackup: false, status: 'healthy', responseTime: 150 },
        { url: backup, isBackup: true, status: 'healthy', responseTime: 180 }
      ],
      metrics: {
        requestsTotal: 0,
        requestsPerSecond: 0,
        avgResponseTime: 0,
        bandwidthUsage: 0,
        successRate: 100,
        errorRate: 0,
        clientErrors: 0,
        serverErrors: 0,
        cacheHitRate: 0,
        lastHourStats: Array.from({ length: 60 }, () => ({
          timestamp: Date.now(),
          requests: 0
        }))
      },
      caching: {
        enabled: false,
        ttl: 3600,
        staleIfError: 300
      },
      security: {
        fail2ban: {
          enabled: false,
          maxRetries: 5,
          findTime: 300,
          banTime: 3600
        },
        trafficSniffing: {
          enabled: false,
          logLevel: 'basic',
          captureHeaders: true,
          captureBodies: false
        },
        rateLimit: {
          enabled: false,
          requestsPerSecond: 100,
          burstSize: 50
        },
        waf: {
          enabled: false,
          rules: [
            { id: 'sql-injection', name: 'SQL Injection Protection', enabled: true, action: 'block' },
            { id: 'xss', name: 'XSS Protection', enabled: true, action: 'block' },
            { id: 'file-inclusion', name: 'File Inclusion Protection', enabled: true, action: 'block' }
          ]
        }
      },
      trafficLastHour: 0
    };
    sites.push(newSite);
    return;
  }
  await axios.post('/api/sites', { domain, primary, backup, sslPassthrough });
};

export const removeSite = async (domain: string): Promise<void> => {
  if (isDemo) {
    sites = sites.filter(site => site.domain !== domain);
    return;
  }
  await axios.delete(`/api/sites/${domain}`);
};

export const updateSiteBackends = async (
  domain: string,
  backends: { url: string; isBackup: boolean }[],
  loadBalancing: LoadBalancingMode
): Promise<void> => {
  if (isDemo) {
    sites = sites.map(site => {
      if (site.domain === domain) {
        return {
          ...site,
          loadBalancing,
          backends: backends.map(b => ({
            ...b,
            status: 'healthy',
            responseTime: Math.floor(Math.random() * 100) + 100
          }))
        };
      }
      return site;
    });
    return;
  }
  await axios.put(`/api/sites/${domain}/backends`, { backends, loadBalancing });
};

export const updateSiteCache = async (domain: string, caching: CacheConfig): Promise<void> => {
  if (isDemo) {
    sites = sites.map(site => {
      if (site.domain === domain) {
        return {
          ...site,
          caching
        };
      }
      return site;
    });
    return;
  }
  await axios.put(`/api/sites/${domain}/cache`, caching);
};

export const refreshCache = async (domain: string): Promise<void> => {
  if (isDemo) {
    sites = sites.map(site => {
      if (site.domain === domain) {
        return {
          ...site,
          metrics: {
            ...site.metrics,
            cacheHitRate: 0
          }
        };
      }
      return site;
    });
    return;
  }
  await axios.post(`/api/sites/${domain}/cache/refresh`);
};

export const updateSiteSecurity = async (domain: string, security: SecurityConfig): Promise<void> => {
  if (isDemo) {
    sites = sites.map(site => {
      if (site.domain === domain) {
        return {
          ...site,
          security
        };
      }
      return site;
    });
    return;
  }
  await axios.put(`/api/sites/${domain}/security`, security);
};