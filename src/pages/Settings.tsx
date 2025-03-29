import React from 'react';
import { AlertTriangle, RefreshCw, Power, Eye, EyeOff } from 'lucide-react';
import type { BackendConfig } from '../lib/api';

interface SettingsProps {
  backendConfig: BackendConfig;
  isSavingConfig: boolean;
  configError: string | null;
  onSave: (e: React.FormEvent) => Promise<void>;
  onDisconnect: () => void;
  onConfigChange: (config: BackendConfig) => void;
}

export function Settings({
  backendConfig,
  isSavingConfig,
  configError,
  onSave,
  onDisconnect,
  onConfigChange,
}: SettingsProps) {
  const [showPasswords, setShowPasswords] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Backend Services Configuration</h3>
          <form onSubmit={onSave} className="mt-5 space-y-4">
            {/* Consul Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Consul Configuration</h4>
              <div>
                <label htmlFor="consul-url" className="block text-sm font-medium text-gray-700">
                  Consul URL
                </label>
                <input
                  type="url"
                  name="consul-url"
                  id="consul-url"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="http://localhost:8500"
                  value={backendConfig.consulUrl || ''}
                  onChange={(e) => onConfigChange({ ...backendConfig, consulUrl: e.target.value })}
                  disabled={isSavingConfig}
                />
              </div>
              <div>
                <label htmlFor="consul-token" className="block text-sm font-medium text-gray-700">
                  Consul ACL Token
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  name="consul-token"
                  id="consul-token"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter Consul ACL token"
                  value={backendConfig.consulToken || ''}
                  onChange={(e) => onConfigChange({ ...backendConfig, consulToken: e.target.value })}
                  disabled={isSavingConfig}
                />
              </div>
            </div>

            {/* Prometheus Configuration */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">Prometheus Configuration</h4>
              <div>
                <label htmlFor="prometheus-url" className="block text-sm font-medium text-gray-700">
                  Prometheus URL
                </label>
                <input
                  type="url"
                  name="prometheus-url"
                  id="prometheus-url"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="http://localhost:9090"
                  value={backendConfig.prometheusUrl || ''}
                  onChange={(e) => onConfigChange({ ...backendConfig, prometheusUrl: e.target.value })}
                  disabled={isSavingConfig}
                />
              </div>
              <div>
                <label htmlFor="prometheus-username" className="block text-sm font-medium text-gray-700">
                  Prometheus Username
                </label>
                <input
                  type="text"
                  name="prometheus-username"
                  id="prometheus-username"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter Prometheus username"
                  value={backendConfig.prometheusUsername || ''}
                  onChange={(e) => onConfigChange({ ...backendConfig, prometheusUsername: e.target.value })}
                  disabled={isSavingConfig}
                />
              </div>
              <div>
                <label htmlFor="prometheus-password" className="block text-sm font-medium text-gray-700">
                  Prometheus Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  name="prometheus-password"
                  id="prometheus-password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter Prometheus password"
                  value={backendConfig.prometheusPassword || ''}
                  onChange={(e) => onConfigChange({ ...backendConfig, prometheusPassword: e.target.value })}
                  disabled={isSavingConfig}
                />
              </div>
            </div>

            {/* Nginx Configuration */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">Nginx Configuration</h4>
              <div>
                <label htmlFor="nginx-url" className="block text-sm font-medium text-gray-700">
                  Nginx URL
                </label>
                <input
                  type="url"
                  name="nginx-url"
                  id="nginx-url"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="http://localhost:80"
                  value={backendConfig.nginxUrl || ''}
                  onChange={(e) => onConfigChange({ ...backendConfig, nginxUrl: e.target.value })}
                  disabled={isSavingConfig}
                />
              </div>
            </div>

            <div className="flex items-center mt-4">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Credentials
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Credentials
                  </>
                )}
              </button>
            </div>

            {configError && (
              <div className="text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {configError}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSavingConfig ? (
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
                onClick={onDisconnect}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Power className="h-4 w-4 mr-2" />
                Disconnect
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}