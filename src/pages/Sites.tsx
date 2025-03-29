import React, { useState } from 'react';
import { Trash2, Edit2, Plus, X, Check, AlertTriangle, Database, RefreshCw } from 'lucide-react';
import type { Site, LoadBalancingMode } from '../lib/api';
import { removeSite, updateSiteBackends, updateSiteCache, refreshCache } from '../lib/api';
import { CacheConfigModal } from '../components/CacheConfigModal';

interface SitesProps {
  sites: Site[];
}

interface EditBackendsModalProps {
  site: Site;
  isOpen: boolean;
  onClose: () => void;
  onSave: (backends: { url: string; isBackup: boolean }[], loadBalancing: LoadBalancingMode) => Promise<void>;
}

const loadBalancingOptions = [
  { value: 'roundrobin', label: 'Round Robin', description: 'Distribute requests evenly across all backends' },
  { value: 'leastconn', label: 'Least Connections', description: 'Send requests to the backend with the least active connections' },
  { value: 'failover', label: 'Failover', description: 'Use primary backends first, only failing over to backup servers when needed' }
];

function EditBackendsModal({ site, isOpen, onClose, onSave }: EditBackendsModalProps) {
  const [backends, setBackends] = useState(site.backends.map(b => ({ url: b.url, isBackup: b.isBackup })));
  const [loadBalancing, setLoadBalancing] = useState<LoadBalancingMode>(site.loadBalancing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(backends, loadBalancing);
      onClose();
    } catch (error) {
      console.error('Failed to update backends:', error);
      alert('Failed to update backends. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Backends for {site.domain}</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="loadBalancing" className="block text-sm font-medium text-gray-700">
                    Load Balancing Mode
                  </label>
                  <select
                    id="loadBalancing"
                    name="loadBalancing"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={loadBalancing}
                    onChange={(e) => setLoadBalancing(e.target.value as LoadBalancingMode)}
                    disabled={isSubmitting}
                  >
                    {loadBalancingOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {loadBalancingOptions.find(opt => opt.value === loadBalancing)?.description}
                  </p>
                </div>
                {backends.map((backend, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={backend.url}
                      onChange={(e) => {
                        const newBackends = [...backends];
                        newBackends[index] = { ...backend, url: e.target.value };
                        setBackends(newBackends);
                      }}
                      className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="backend.example.com:8080"
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={backend.isBackup}
                        onChange={(e) => {
                          const newBackends = [...backends];
                          newBackends[index] = { ...backend, isBackup: e.target.checked };
                          setBackends(newBackends);
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={isSubmitting || loadBalancing === 'failover'}
                      />
                      <label className="ml-2 text-sm text-gray-700">Backup</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBackends(backends.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-700"
                      disabled={isSubmitting || backends.length <= 1}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setBackends([...backends, { url: '', isBackup: false }])}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Backend
                </button>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={isSubmitting || backends.length === 0 || backends.some(b => !b.url)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Sites({ sites }: SitesProps) {
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [cachingSite, setCachingSite] = useState<Site | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);

  const handleRemoveSite = async (domain: string) => {
    if (!confirm(`Are you sure you want to remove ${domain}?`)) return;
    
    setIsDeleting(domain);
    try {
      await removeSite(domain);
      // The parent component will automatically refresh the sites list
    } catch (error) {
      console.error('Failed to remove site:', error);
      alert('Failed to remove site. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateBackends = async (domain: string, backends: { url: string; isBackup: boolean }[], loadBalancing: LoadBalancingMode) => {
    try {
      await updateSiteBackends(domain, backends, loadBalancing);
      // The parent component will automatically refresh the sites list
    } catch (error) {
      console.error('Failed to update backends:', error);
      throw error;
    }
  };

  const handleUpdateCache = async (domain: string, caching: CacheConfig) => {
    try {
      await updateSiteCache(domain, caching);
      // The parent component will automatically refresh the sites list
    } catch (error) {
      console.error('Failed to update cache config:', error);
      throw error;
    }
  };

  const handleRefreshCache = async (domain: string) => {
    setIsRefreshing(domain);
    try {
      await refreshCache(domain);
      // The parent component will automatically refresh the sites list
    } catch (error) {
      console.error('Failed to refresh cache:', error);
      alert('Failed to refresh cache. Please try again.');
    } finally {
      setIsRefreshing(null);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Sites</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all sites and their backend configurations.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Domain
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        SSL Passthrough
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Load Balancing
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Cache Hit Rate
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Backends
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sites.map((site) => (
                      <tr key={site.domain}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {site.domain}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            site.status === 'active' ? 'bg-green-100 text-green-800' :
                            site.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {site.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {site.sslPassthrough ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-gray-400" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {site.loadBalancing}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${site.metrics.cacheHitRate}%` }}
                              ></div>
                            </div>
                            <span>{site.metrics.cacheHitRate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="space-y-1">
                            {site.backends.map((backend) => (
                              <div key={backend.url} className="flex items-center">
                                <span className={`h-2 w-2 rounded-full mr-2 ${
                                  backend.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                                }`}></span>
                                <span>{backend.url}</span>
                                {backend.isBackup && (
                                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 rounded">
                                    Backup
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingSite(site)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Backends"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setCachingSite(site)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Configure Cache"
                            >
                              <Database className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleRefreshCache(site.domain)}
                              className="text-green-600 hover:text-green-900"
                              disabled={isRefreshing === site.domain}
                              title="Refresh Cache"
                            >
                              <RefreshCw className={`h-5 w-5 ${isRefreshing === site.domain ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleRemoveSite(site.domain)}
                              className="text-red-600 hover:text-red-900"
                              disabled={isDeleting === site.domain}
                              title="Remove Site"
                            >
                              {isDeleting === site.domain ? (
                                <AlertTriangle className="h-5 w-5 animate-pulse" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingSite && (
        <EditBackendsModal
          site={editingSite}
          isOpen={true}
          onClose={() => setEditingSite(null)}
          onSave={(backends, loadBalancing) => handleUpdateBackends(editingSite.domain, backends, loadBalancing)}
        />
      )}

      {cachingSite && (
        <CacheConfigModal
          isOpen={true}
          domain={cachingSite.domain}
          caching={cachingSite.caching}
          onClose={() => setCachingSite(null)}
          onSave={(config) => handleUpdateCache(cachingSite.domain, config)}
        />
      )}
    </div>
  );
}