import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { CacheConfig } from '../lib/api';

interface CacheConfigModalProps {
  isOpen: boolean;
  domain: string;
  caching: CacheConfig;
  onClose: () => void;
  onSave: (config: CacheConfig) => Promise<void>;
}

export function CacheConfigModal({
  isOpen,
  domain,
  caching: initialCaching,
  onClose,
  onSave,
}: CacheConfigModalProps) {
  const [caching, setCaching] = useState<CacheConfig>(initialCaching);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(caching);
      onClose();
    } catch (error) {
      console.error('Failed to update cache configuration:', error);
      alert('Failed to update cache configuration. Please try again.');
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
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Cache Configuration for {domain}
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cache-enabled"
                    checked={caching.enabled}
                    onChange={(e) => setCaching({ ...caching, enabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="cache-enabled" className="ml-2 block text-sm text-gray-900">
                    Enable Caching
                  </label>
                </div>

                <div>
                  <label htmlFor="ttl" className="block text-sm font-medium text-gray-700">
                    Cache Duration (seconds)
                  </label>
                  <input
                    type="number"
                    id="ttl"
                    value={caching.ttl}
                    onChange={(e) => setCaching({ ...caching, ttl: parseInt(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="0"
                    disabled={isSubmitting || !caching.enabled}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    How long should content be cached before being refreshed?
                  </p>
                </div>

                <div>
                  <label htmlFor="grace" className="block text-sm font-medium text-gray-700">
                    Grace Period (seconds)
                  </label>
                  <input
                    type="number"
                    id="grace"
                    value={caching.staleIfError}
                    onChange={(e) => setCaching({ ...caching, staleIfError: parseInt(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="0"
                    disabled={isSubmitting || !caching.enabled}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    How long should stale content be served if the backend is down?
                  </p>
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
                    Saving...
                  </>
                ) : (
                  'Save Changes'
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