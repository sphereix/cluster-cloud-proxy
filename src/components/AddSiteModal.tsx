import React from 'react';
import { RefreshCw } from 'lucide-react';

type LoadBalancingMode = 'round_robin' | 'least_conn' | 'ip_hash' | 'failover';

interface AddSiteModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  newSite: {
    domain: string;
    primary: string;
    backup: string;
    sslPassthrough: boolean;
    loadBalancing: LoadBalancingMode;
  };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (site: {
    domain: string;
    primary: string;
    backup: string;
    sslPassthrough: boolean;
    loadBalancing: LoadBalancingMode;
  }) => void;
}

const loadBalancingOptions = [
  { value: 'round_robin', label: 'Round Robin', description: 'Distributes requests sequentially across backends' },
  { value: 'least_conn', label: 'Least Connections', description: 'Sends requests to backend with fewest active connections' },
  { value: 'ip_hash', label: 'IP Hash', description: 'Consistent hashing based on client IP (session persistence)' },
  { value: 'failover', label: 'Failover', description: 'Uses backup servers only when primary servers fail' }
] as const;

export function AddSiteModal({
  isOpen,
  isSubmitting,
  newSite,
  onClose,
  onSubmit,
  onChange,
}: AddSiteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={onSubmit}>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Site</h3>
              <div className="mt-2">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                      Domain
                    </label>
                    <input
                      type="text"
                      name="domain"
                      id="domain"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newSite.domain}
                      onChange={(e) => onChange({ ...newSite, domain: e.target.value })}
                      placeholder="example.com"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="primary" className="block text-sm font-medium text-gray-700">
                      Primary Backend
                    </label>
                    <input
                      type="text"
                      name="primary"
                      id="primary"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newSite.primary}
                      onChange={(e) => onChange({ ...newSite, primary: e.target.value })}
                      placeholder="backend1.example.com:8080"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="backup" className="block text-sm font-medium text-gray-700">
                      Backup Backend
                    </label>
                    <input
                      type="text"
                      name="backup"
                      id="backup"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newSite.backup}
                      onChange={(e) => onChange({ ...newSite, backup: e.target.value })}
                      placeholder="backend2.example.com:8080"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="loadBalancing" className="block text-sm font-medium text-gray-700">
                      Load Balancing Mode
                    </label>
                    <select
                      id="loadBalancing"
                      name="loadBalancing"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={newSite.loadBalancing}
                      onChange={(e) => onChange({ ...newSite, loadBalancing: e.target.value as LoadBalancingMode })}
                      disabled={isSubmitting}
                    >
                      {loadBalancingOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      {loadBalancingOptions.find(opt => opt.value === newSite.loadBalancing)?.description}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ssl-passthrough"
                      name="ssl-passthrough"
                      checked={newSite.sslPassthrough}
                      onChange={(e) => onChange({ ...newSite, sslPassthrough: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="ssl-passthrough" className="ml-2 block text-sm text-gray-900">
                      Enable SSL Passthrough
                    </label>
                    <div className="ml-2 group relative">
                      <span className="text-gray-400 hover:text-gray-500 cursor-help">ⓘ</span>
                      <div className="hidden group-hover:block absolute z-10 w-72 px-2 py-1 bg-gray-900 text-white text-xs rounded mt-1 ml-1">
                        When enabled, SSL/TLS termination is handled by the backend servers instead of the proxy
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Site'
                )}
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