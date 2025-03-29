import React, { useState } from 'react';
import { BarChart3, Clock, AlertTriangle, Activity, ArrowUp, ArrowDown, Wifi, Server, Shield, XCircle, Globe } from 'lucide-react';
import type { Site } from '../lib/api';

interface AnalyticsProps {
  sites: Site[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-md bg-indigo-500 flex items-center justify-center">
              {React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6 text-white' })}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    <span className="sr-only">{change >= 0 ? 'Increased' : 'Decreased'} by</span>
                    {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeSeriesChart({ data, title }: { data: Array<{ timestamp: number; requests: number }>; title: string }) {
  const maxValue = Math.max(...data.map(d => d.requests));
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end">
          {data.map((point, index) => (
            <div
              key={index}
              className="flex-1 mx-px group"
              style={{ height: `${(point.requests / maxValue) * 100}%` }}
            >
              <div className="h-full bg-indigo-200 hover:bg-indigo-300 transition-colors">
                <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  {new Date(point.timestamp).toLocaleTimeString()}
                  <br />
                  {point.requests.toLocaleString()} requests
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Analytics({ sites }: AnalyticsProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  const getFilteredSites = () => {
    if (selectedDomain === 'all') return sites;
    return sites.filter(site => site.domain === selectedDomain);
  };

  const filteredSites = getFilteredSites();

  // Calculate metrics based on filtered sites
  const totalRequests = filteredSites.reduce((acc, site) => acc + site.metrics.requestsTotal, 0);
  const avgResponseTime = filteredSites.length > 0
    ? Math.round(filteredSites.reduce((acc, site) => acc + site.metrics.avgResponseTime, 0) / filteredSites.length)
    : 0;
  const totalBandwidth = filteredSites.reduce((acc, site) => acc + site.metrics.bandwidthUsage, 0);
  const globalSuccessRate = filteredSites.length > 0
    ? Math.round(filteredSites.reduce((acc, site) => acc + site.metrics.successRate, 0) / filteredSites.length)
    : 100;
  const totalClientErrors = filteredSites.reduce((acc, site) => acc + site.metrics.clientErrors, 0);
  const totalServerErrors = filteredSites.reduce((acc, site) => acc + site.metrics.serverErrors, 0);
  const avgCacheHitRate = filteredSites.length > 0
    ? Math.round(filteredSites.reduce((acc, site) => acc + site.metrics.cacheHitRate, 0) / filteredSites.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Domain Selection */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <Globe className="h-5 w-5 text-gray-400" />
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Domains</option>
            {sites.map((site) => (
              <option key={site.domain} value={site.domain}>
                {site.domain}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Requests"
          value={totalRequests.toLocaleString()}
          change={2.5}
          icon={<BarChart3 />}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${avgResponseTime}ms`}
          change={-1.2}
          icon={<Clock />}
        />
        <MetricCard
          title="Total Bandwidth"
          value={`${(totalBandwidth / 1024).toFixed(2)} MB/s`}
          change={3.8}
          icon={<Wifi />}
        />
        <MetricCard
          title="Success Rate"
          value={`${globalSuccessRate}%`}
          change={0.5}
          icon={<Shield />}
        />
      </div>

      {/* Cache and Error Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Cache Performance</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-indigo-600">{avgCacheHitRate}%</div>
            <div className="text-sm text-gray-500">Cache Hit Rate</div>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-indigo-600 rounded-full"
              style={{ width: `${avgCacheHitRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Error Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">4xx Errors</span>
                <span className="font-medium">{totalClientErrors.toLocaleString()}</span>
              </div>
              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-yellow-400 rounded-full"
                  style={{ width: `${(totalClientErrors / totalRequests) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">5xx Errors</span>
                <span className="font-medium">{totalServerErrors.toLocaleString()}</span>
              </div>
              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-red-400 rounded-full"
                  style={{ width: `${(totalServerErrors / totalRequests) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Trends */}
      <div className="grid grid-cols-1 gap-5">
        {filteredSites.map((site) => (
          <div key={site.domain} className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">{site.domain}</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TimeSeriesChart
                data={site.metrics.lastHourStats}
                title="Traffic (Last Hour)"
              />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Requests/sec</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {site.metrics.requestsPerSecond.toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Avg Response</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {site.metrics.avgResponseTime}ms
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Error Rate</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {(site.metrics.errorRate * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Cache Hit Rate</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {site.metrics.cacheHitRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}