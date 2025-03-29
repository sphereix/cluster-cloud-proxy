import React, { useState } from 'react';
import { Settings, Plus, AlertTriangle, Cog, Power, Shield } from 'lucide-react';
import useSWR from 'swr';
import { getSites, addSite, isConfigured, getBackendConfig, setBackendConfig, disableDemoMode, enableDemoMode, login, type Site, type BackendConfig, type LoginCredentials, type User } from './lib/api';
import { LandingPage } from './components/LandingPage';
import { ConfigureBackend } from './components/ConfigureBackend';
import { Overview } from './pages/Overview';
import { Sites } from './pages/Sites';
import { Analytics } from './pages/Analytics';
import { Settings as SettingsPage } from './pages/Settings';
import { Security } from './pages/Security';
import { AddSiteModal } from './components/AddSiteModal';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [loginError, setLoginError] = useState<string>();
  const [configured] = useState(isConfigured());

  const { data: sites = [], error, mutate } = useSWR<Site[]>(
    user || showConfig ? 'sites' : null,
    getSites,
    { refreshInterval: 10000 }
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'analytics' | 'settings' | 'security'>('overview');
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSite, setNewSite] = useState({ domain: '', primary: '', backup: '', sslPassthrough: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendConfig, setBackendConfigState] = useState<BackendConfig>(getBackendConfig());
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoginError(undefined);
    const user = await login(credentials);
    if (user) {
      setUser(user);
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await addSite(newSite.domain, newSite.primary, newSite.backup, newSite.sslPassthrough);
      await mutate();
      setShowAddSite(false);
      setNewSite({ domain: '', primary: '', backup: '', sslPassthrough: false });
    } catch (error) {
      console.error('Failed to add site:', error);
      alert('Failed to add site. Please check the console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigError(null);

    try {
      const success = await setBackendConfig(backendConfig);
      if (success) {
        await mutate();
      } else {
        setConfigError('Failed to connect to one or more services');
      }
    } catch (err) {
      setConfigError('Failed to save configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleExitDemo = () => {
    disableDemoMode();
    setUser(null);
    setShowConfig(false);
    mutate();
  };

  if (!user && !showConfig) {
    return (
      <LandingPage
        onLogin={handleLogin}
        onConfigure={() => setShowConfig(true)}
        onDemoMode={() => {
          enableDemoMode();
          setUser({ username: 'demo', isAdmin: true });
        }}
        error={loginError}
      />
    );
  }

  if (showConfig && !configured) {
    return (
      <ConfigureBackend
        onConfigured={() => {
          setShowConfig(false);
          setUser({ username: 'admin', isAdmin: true });
        }}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Failed to load data</h3>
          <p className="mt-2 text-sm text-gray-500">Please check your connection to the backend services.</p>
          <button
            onClick={() => mutate()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Settings className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">Proxy Manager</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('sites')}
                  className={`${
                    activeTab === 'sites'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Sites
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`${
                    activeTab === 'analytics'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`${
                    activeTab === 'security'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`${
                    activeTab === 'settings'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Cog className="h-4 w-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExitDemo}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Power className="h-4 w-4 mr-2" />
                Exit Demo
              </button>
              <button
                onClick={() => setShowAddSite(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Site
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' && <Overview sites={sites} />}
        {activeTab === 'sites' && <Sites sites={sites} />}
        {activeTab === 'analytics' && <Analytics sites={sites} />}
        {activeTab === 'security' && <Security sites={sites} />}
        {activeTab === 'settings' && (
          <SettingsPage
            backendConfig={backendConfig}
            isSavingConfig={isSavingConfig}
            configError={configError}
            onSave={handleSaveConfig}
            onDisconnect={handleExitDemo}
            onConfigChange={setBackendConfigState}
          />
        )}
      </main>

      <AddSiteModal
        isOpen={showAddSite}
        isSubmitting={isSubmitting}
        newSite={newSite}
        onClose={() => setShowAddSite(false)}
        onSubmit={handleAddSite}
        onChange={setNewSite}
      />
    </div>
  );
}

export default App;