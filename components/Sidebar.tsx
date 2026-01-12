
import React from 'react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'logs', label: 'Hours Log', icon: '🕒' },
    { id: 'competencies', label: 'Competencies', icon: '🎯' },
    { id: 'artifacts', label: 'Artifact Vault', icon: '📁' },
    { id: 'sites', label: 'Sites', icon: '🏫' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 hidden md:flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          InternPro
        </h1>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Bethel University</p>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 mb-1">Portfolio Status</p>
          <p className="text-[10px] text-slate-400 mt-2 tracking-tight uppercase font-black">Active Session</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
