import React from 'react';
import {
  LayoutDashboard,
  Wand2,
  ScanEye,
  Layers,
  History,
  Building2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
  Home,
  User,
  LogOut
} from 'lucide-react';

export default function Sidebar({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onGoLanding,
  user,
  onLogout
}) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'restore', label: 'Restore Documents', icon: Wand2 },
    { id: 'analysis', label: 'AI Analysis', icon: ScanEye },
    { id: 'batch', label: 'Batch Processing', icon: Layers },
    { id: 'history', label: 'Document History', icon: History },
    { id: 'migration', label: 'HR Migration Center', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative z-30 h-screen bg-[#050709] border-r border-[#22323D] transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="h-20 flex items-center justify-between px-4 border-b border-[#22323D]">
          <div 
            onClick={onGoLanding} 
            className="flex items-center space-x-3 cursor-pointer overflow-hidden"
          >
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-[#101820] border border-[#00E5FF]/40 flex items-center justify-center shadow-cyan-glow">
              <Sparkles className="w-5 h-5 text-[#00E5FF]" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-base font-bold font-mono tracking-wider text-[#F8FAFC]">
                  IDRESTORE <span className="text-[#00E5FF]">AI</span>
                </span>
                <span className="block text-[8px] font-mono tracking-widest text-[#94A3B8] uppercase">
                  ENTERPRISE STUDIO
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-[#101820] text-[#00E5FF] border border-[#00E5FF]/40 shadow-cyan-glow font-bold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0B1117]'
                }`}
              >
                <IconComponent className={`w-4 h-4 min-w-[16px] ${isActive ? 'text-[#00E5FF]' : 'text-[#94A3B8]'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="border-t border-[#22323D]">
        {/* User Card */}
        {user && (
          <div className="p-3 border-b border-[#22323D]/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 min-w-[32px] rounded-lg bg-[#17232C] border border-[#00FFA3]/40 flex items-center justify-center text-[#00FFA3]">
                <User className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="truncate text-left">
                  <span className="block text-xs font-mono font-bold text-[#F8FAFC] truncate">
                    {user.full_name || 'HR Officer'}
                  </span>
                  <span className="block text-[9px] font-mono text-[#00FFA3] uppercase tracking-wider">
                    {user.role || 'HR_ANALYST'}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#FF5C5C] hover:bg-[#101820] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="p-3 space-y-2">
          <button
            onClick={onGoLanding}
            title={isCollapsed ? "Back to Landing" : undefined}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#0B1117] transition-all"
          >
            <Home className="w-4 h-4 min-w-[16px]" />
            {!isCollapsed && <span>Landing Portal</span>}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#101820] transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
