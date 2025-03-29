import React, { useState } from 'react';
import { Shield, AlertTriangle, Eye, Ban, Activity } from 'lucide-react';
import type { Site, SecurityConfig, WafRule } from '../lib/api';
import { updateSiteSecurity } from '../lib/api';

interface SecurityProps {
  sites: Site[];
}

interface SecuritySettingsProps {
  site: Site;
  onUpdate: (security: SecurityConfig) => Promise<void>;
}

function SecuritySettings({ site, onUpdate }: SecuritySettingsProps) {
  const [security, setSecurity] = useState<SecurityConfig>(site.security);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdate(security);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fail2Ban Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Ban className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Fail2Ban</h3>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fail2ban-enabled"
              checked={security.fail2ban.enabled}
              onChange={(e) => setSecurity({
                ...security,
                fail2ban: { ...security.fail2ban, enabled: e.target.checked }
              })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="fail2ban-enabled" className="ml-2 text-sm text-gray-900">
              Enable
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Retries</label>
            <input
              type="number"
              value={security.fail2ban.maxRetries}
              onChange={(e) => setSecurity({
                ...security,
                fail2ban: { ...security.fail2ban, maxRetries: parseInt(e.target.value) }
              })}
              disabled={!security.fail2ban.enabled}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Find Time (seconds)</label>
            <input
              type="number"
              value={security.fail2ban.findTime}
              onChange={(e) => setSecurity({
                ...security,
                fail2ban: { ...security.fail2ban, findTime: parseInt(e.target.value) }
              })}
              disabled={!security.fail2ban.enabled}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ban Time (seconds)</label>
            <input
              type="number"
              value={security.fail2ban.banTime}
              onChange={(e) => setSecurity({
                ...security,
                fail2ban: { ...security.fail2ban, banTime: parseInt(e.target.value) }
              })}
              disabled={!security.fail2ban.enabled}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Traffic Sniffing Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Eye className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Traffic Sniffing</h3>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sniffing-enabled"
              checked={security.trafficSniffing.enabled}
              onChange={(e) => setSecurity({
                ...security,
                trafficSniffing: { ...security.trafficSniffing, enabled: e.target.checked }
              })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="sniffing-enabled" className="ml-2 text-sm text-gray-900">
              Enable
            </label>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Log Level</label>
            <select
              value={security.trafficSniffing.logLevel}
              onChange={(e) => setSecurity({
                ...security,
                trafficSniffing: {
                  ...security.trafficSniffing,
                  logLevel: e.target.value as 'basic' | 'detailed' | 'full'
                }
              })}
              disabled={!security.trafficSniffing.enabled}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="basic">Basic</option>
              <option value="detailed">Detailed</option>
              <option value="full">Full</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="capture-headers"
                checked={security.trafficSniffing.captureHeaders}
                onChange={(e) => setSecurity({
                  ...security,
                  trafficSniffing: {
                    ...security.trafficSniffing,
                    captureHeaders: e.target.checked
                  }
                })}
                disabled={!security.trafficSniffing.enabled}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="capture-headers" className="ml-2 text-sm text-gray-900">
                Capture Headers
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="capture-bodies"
                checked={security.trafficSniffing.captureBodies}
                onChange={(e) => setSecurity({
                  ...security,
                  trafficSniffing: {
                    ...security.trafficSniffing,
                    captureBodies: e.target.checked
                  }
                })}
                disabled={!security.trafficSniffing.enabled}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="capture-bodies" className="ml-2 text-sm text-gray-900">
                Capture Bodies
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limiting Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Rate Limiting</h3>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rate-limit-enabled"
              checked={security.rateLimit.enabled}
              onChange={(e) => setSecurity({
                ...security,
                rateLimit: { ...security.rateLimit, enabled: e.target.checked }
              })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="rate-limit-enabled" className="ml-2 text-sm text-gray-900">
              Enable
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Requests per Second</label>
            <input
              type="number"
              value={security.rateLimit.requestsPerSecond}
              onChange={(e) => setSecurity({
                ...security,
                rateLimit: {
                  ...security.rateLimit,
                  requestsPerSecond: parseInt(e.target.value)
                }
              })}
              disabled={!security.rateLimit.enabled}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Burst Size</label>
            <input
              type="number"
              value={security.rateLimit.burstSize}
              onChange={(e) => setSecurity({
                ...security,
                rateLimit: { ...security.rateLimit, burstSize: parseInt(e.target.value) }
              })}
              disabled={!security.rateLimit.enabled}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* WAF Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Web Application Firewall</h3>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="waf-enabled"
              checked={security.waf.enabled}
              onChange={(e) => setSecurity({
                ...security,
                waf: { ...security.waf, enabled: e.target.checked }
              })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="waf-enabled" className="ml-2 text-sm text-gray-900">
              Enable
            </label>
          </div>
        </div>
        <div className="space-y-4">
          {security.waf.rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{rule.name}</h4>
                <p className="text-sm text-gray-500">
                  Action: {rule.action}
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => {
                    const updatedRules = security.waf.rules.map(r =>
                      r.id === rule.id ? { ...r, enabled: e.target.checked } : r
                    );
                    setSecurity({
                      ...security,
                      waf: { ...security.waf, rules: updatedRules }
                    });
                  }}
                  disabled={!security.waf.enabled}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isUpdating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export function Security({ sites }: SecurityProps) {
  const [selectedSite, setSelectedSite] = useState<string>(sites[0]?.domain || '');

  const handleUpdateSecurity = async (security: SecurityConfig) => {
    await updateSiteSecurity(selectedSite, security);
  };

  const site = sites.find(s => s.domain === selectedSite);
  if (!site) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {sites.map((site) => (
                <option key={site.domain} value={site.domain}>
                  {site.domain}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <SecuritySettings site={site} onUpdate={handleUpdateSecurity} />
    </div>
  );
}