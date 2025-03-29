import React, { useState } from 'react';
import { Settings, CheckCircle, XCircle, PlayCircle, Eye, EyeOff } from 'lucide-react';
import { setBackendConfig, getBackendConfig, type BackendConfig, enableDemoMode } from '../lib/api';

interface ConfigureBackendProps {
  onConfigured: () => void;
}

export function ConfigureBackend({ onConfigured }: ConfigureBackendProps) {
  const [config, setConfig] = useState<BackendConfig>(getBackendConfig());
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setError(null);

    try {
      const success = await setBackendConfig(config);
      if (success) {
        onConfigured();
      } else {
        setError('Failed to connect to one or more services');
      }
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex justify-center h-12 w-12 text-indigo-600">
            <Settings className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Configure Backend Services
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the URLs and credentials for your backend services
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Consul Configuration */}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="consul-url" className="sr-only">Consul URL</label>
              <input
                id="consul-url"
                name="consul-url"
                type="url"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Consul URL (e.g., http://localhost:8500)"
                value={config.consulUrl || ''}
                onChange={(e) => setConfig({ ...config, consulUrl: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="consul-token" className="sr-only">Consul Token</label>
              <input
                id="consul-token"
                name="consul-token"
                type={showPasswords ? 'text' : 'password'}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Consul ACL Token"
                value={config.consulToken || ''}
                onChange={(e) => setConfig({ ...config, consulToken: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="prometheus-url" className="sr-only">Prometheus URL</label>
              <input
                id="prometheus-url"
                name="prometheus-url"
                type="url"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Prometheus URL (e.g., http://localhost:9090)"
                value={config.prometheusUrl || ''}
                onChange={(e) => setConfig({ ...config, prometheusUrl: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="prometheus-username" className="sr-only">Prometheus Username</label>
              <input
                id="prometheus-username"
                name="prometheus-username"
                type="text"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Prometheus Username"
                value={config.prometheusUsername || ''}
                onChange={(e) => setConfig({ ...config, prometheusUsername: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="prometheus-password" className="sr-only">Prometheus Password</label>
              <input
                id="prometheus-password"
                name="prometheus-password"
                type={showPasswords ? 'text' : 'password'}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Prometheus Password"
                value={config.prometheusPassword || ''}
                onChange={(e) => setConfig({ ...config, prometheusPassword: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="nginx-url" className="sr-only">Nginx URL</label>
              <input
                id="nginx-url"
                name="nginx-url"
                type="url"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nginx URL (e.g., http://localhost:80)"
                value={config.nginxUrl || ''}
                onChange={(e) => setConfig({ ...config, nginxUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {showPasswords ? (
                <>
                  <EyeOff className="h-5 w-5 mr-2" />
                  Hide Credentials
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 mr-2" />
                  Show Credentials
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center text-sm text-red-600">
              <XCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={testing}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Settings className="h-5 w-5 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}