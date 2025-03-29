import React from 'react';
import { Activity, Server, Shield, ChevronDown } from 'lucide-react';
import type { Site } from '../lib/api';

interface OverviewProps {
  sites: Site[];
}

export function Overview({ sites }: OverviewProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Server className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Sites</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{sites.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Traffic (1h)</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {sites.reduce((acc, site) => acc + site.trafficLastHour, 0).toLocaleString()}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Health Status</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {sites.filter(site => site.status === 'active').length}/{sites.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Site List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Sites Overview</h3>
          <div className="mt-4 divide-y divide-gray-200">
            {sites.map((site) => (
              <div key={site.domain} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
                      site.status === 'active' ? 'bg-green-400' :
                      site.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></span>
                    <span className="text-sm font-medium text-gray-900">{site.domain}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {site.trafficLastHour.toLocaleString()} requests/hour
                    </span>
                    <button className="text-gray-400 hover:text-gray-500">
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-2">
                  {site.backends.map((backend) => (
                    <div key={backend.url} className="flex items-center text-sm">
                      <span className={`h-2 w-2 rounded-full mr-2 ${
                        backend.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                      }`}></span>
                      <span className="text-gray-600">{backend.url}</span>
                      {backend.isBackup && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 rounded">
                          Backup
                        </span>
                      )}
                      <span className="ml-2 text-gray-500">
                        {backend.responseTime}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}