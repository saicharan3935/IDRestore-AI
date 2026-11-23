import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardOverview from './pages/DashboardOverview';
import RestorationWorkspace from './pages/RestorationWorkspace';
import AIAnalysisStudio from './pages/AIAnalysisStudio';
import BatchProcessing from './pages/BatchProcessing';
import DocumentHistory from './pages/DocumentHistory';
import HRMigrationCenter from './pages/HRMigrationCenter';
import AnalyticsView from './pages/AnalyticsView';
import SettingsView from './pages/SettingsView';
import AuthErrorBoundary from './components/common/AuthErrorBoundary';

import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [redirectTargetTab, setRedirectTargetTab] = useState('overview');

  const [currentTab, setCurrentTab] = useState('overview'); // dashboard tabs
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Restore authenticated session from server cookie on mount
  useEffect(() => {
    api.getCurrentUser()
      .then((userData) => {
        if (userData && userData.id) {
          setUser(userData);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsCheckingSession(false);
      });
  }, []);

  // Launch workspace action: checks authentication first
  const handleLaunchWorkspace = (tab = 'overview') => {
    if (user) {
      setCurrentTab(tab);
      setCurrentView('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setRedirectTargetTab(tab);
      setAuthMode('login');
      setCurrentView('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenAuth = (mode = 'login', targetTab = 'overview') => {
    setAuthMode(mode);
    setRedirectTargetTab(targetTab);
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (authenticatedUser, targetTab = 'overview') => {
    setUser(authenticatedUser);
    setCurrentTab(targetTab);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Continue client cleanup even if network request fails
    }
    setUser(null);
    setCurrentView('landing');
    setCurrentTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoLanding = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearch = (query) => {
    setGlobalSearchQuery(query);
    if (query.trim() && currentTab !== 'history') {
      setCurrentTab('history');
    }
  };

  // Only block if directly attempting to render private dashboard while session is resolving
  if (currentView === 'dashboard' && isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#050709] flex items-center justify-center text-[#F8FAFC]">
        <div className="flex flex-col items-center space-y-3 font-mono text-xs text-[#00E5FF]">
          <span className="w-6 h-6 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
          <span className="tracking-widest uppercase">VERIFYING WORKSPACE CREDENTIALS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050709] text-[#F8FAFC]">
      {/* 1. LANDING PORTAL VIEW */}
      {currentView === 'landing' && (
        <div className="w-full">
          <Navbar
            onNavigate={(view, tab) => {
              if (view === 'dashboard') handleLaunchWorkspace(tab);
              else handleGoLanding();
            }}
            onOpenAuth={handleOpenAuth}
            user={user}
            onLogout={handleLogout}
          />
          <LandingPage
            onLaunchWorkspace={handleLaunchWorkspace}
            onNavigateAuth={handleOpenAuth}
          />
        </div>
      )}

      {/* 2. AUTHENTICATION & ACCESS CONTROL VIEW */}
      {currentView === 'auth' && (
        <AuthErrorBoundary onGoSignIn={() => setAuthMode('login')}>
          <AuthPage
            initialMode={authMode}
            redirectTab={redirectTargetTab}
            onAuthSuccess={handleAuthSuccess}
            onGoLanding={handleGoLanding}
          />
        </AuthErrorBoundary>
      )}

      {/* 3. PROTECTED ENTERPRISE WORKSPACE (Requires user session) */}
      {currentView === 'dashboard' && (
        user ? (
          <div className="flex h-screen overflow-hidden bg-[#050709]">
            {/* Collapsible Enterprise Sidebar */}
            <Sidebar
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onGoLanding={handleGoLanding}
              user={user}
              onLogout={handleLogout}
            />

            {/* Main Content Pane */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
              <TopBar
                onSearch={handleGlobalSearch}
                systemStatus="operational"
                user={user}
                onLogout={handleLogout}
              />

              <main className="flex-1 overflow-y-auto">
                {currentTab === 'overview' && (
                  <DashboardOverview onNavigateTab={setCurrentTab} />
                )}
                {currentTab === 'restore' && <RestorationWorkspace />}
                {currentTab === 'analysis' && (
                  <AIAnalysisStudio onNavigateTab={setCurrentTab} />
                )}
                {currentTab === 'batch' && <BatchProcessing />}
                {currentTab === 'history' && (
                  <DocumentHistory initialSearch={globalSearchQuery} />
                )}
                {currentTab === 'migration' && (
                  <HRMigrationCenter onNavigateTab={setCurrentTab} />
                )}
                {currentTab === 'analytics' && <AnalyticsView />}
                {currentTab === 'settings' && <SettingsView />}
              </main>
            </div>
          </div>
        ) : (
          /* Security fallback redirect */
          <AuthErrorBoundary onGoSignIn={() => setAuthMode('login')}>
            <AuthPage
              initialMode="login"
              redirectTab={currentTab}
              onAuthSuccess={handleAuthSuccess}
              onGoLanding={handleGoLanding}
            />
          </AuthErrorBoundary>
        )
      )}
    </div>
  );
}
