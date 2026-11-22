import React, { useState } from 'react';
import { Search, Bell, Shield, User, Cpu, Activity, LogOut } from 'lucide-react';

export default function TopBar({ onSearch, systemStatus = "operational", user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Seed Document Generated', time: 'Just now', type: 'info' },
    { id: 2, title: 'OpenCV Restoration Engine Active', time: '2m ago', type: 'success' },
    { id: 3, title: 'HRMS Migration Pipeline Ready', time: '5m ago', type: 'info' }
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="h-20 bg-[#050709]/80 backdrop-blur-xl border-b border-[#22323D] px-6 flex items-center justify-between z-20">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search personnel records, batch IDs, or audit logs..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#101820] border border-[#22323D] text-xs font-mono text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#00E5FF]/60 transition-colors"
        />
      </div>

      {/* Right Telemetry & Profile Group */}
      <div className="flex items-center space-x-4">
        {/* System Health Status Indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#101820] border border-[#22323D] text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-[#00FFA3]" />
          <span className="text-[#94A3B8]">ENGINE:</span>
          <span className="text-[#00FFA3] font-bold uppercase">{systemStatus}</span>
        </div>

        {/* AI Model Indicator */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#101820] border border-[#22323D] text-xs font-mono">
          <Cpu className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span className="text-[#94A3B8]">AI CORE:</span>
          <span className="text-[#00E5FF] font-bold">GEMINI + OPENCV</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-[#101820] border border-[#22323D] text-[#94A3B8] hover:text-[#00E5FF] transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00E5FF]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 rounded-xl bg-[#101820] border border-[#22323D] p-3 shadow-2xl z-50">
              <div className="text-xs font-mono text-[#00E5FF] font-semibold mb-2">SYSTEM NOTIFICATIONS</div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-[#0B1117] text-xs font-mono">
                    <div className="text-[#DCE7EC] font-medium">{n.title}</div>
                    <div className="text-[10px] text-[#94A3B8]">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Workspace Profile */}
        <div className="flex items-center space-x-3 pl-3 border-l border-[#22323D]">
          <div className="w-8 h-8 rounded-lg bg-[#17232C] border border-[#00FFA3]/40 flex items-center justify-center text-[#00FFA3]">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-mono font-bold text-[#F8FAFC]">
              {user ? user.full_name : 'HR Migration Lead'}
            </span>
            <span className="block text-[9px] font-mono text-[#00FFA3] uppercase tracking-wider">
              {user ? user.role : 'Enterprise Security'}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-[#94A3B8] hover:text-[#FF5C5C] hover:bg-[#101820] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
