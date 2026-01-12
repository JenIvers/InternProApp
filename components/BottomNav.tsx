
import React from 'react';

interface BottomNavProps {
  currentView: string;
  setView: (view: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: '📊' },
    { id: 'logs', label: 'Logs', icon: '🕒' },
    { id: 'competencies', label: 'Skills', icon: '🎯' },
    { id: 'artifacts', label: 'Vault', icon: '📁' },
    { id: 'sites', label: 'Sites', icon: '🏫' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 pb-safe">
      <nav className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full space-y-1 group transition-all"
            >
              <span className={`text-lg transition-transform ${isActive ? 'scale-110 mb-0.5' : 'opacity-60 group-active:scale-95'}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-tight ${
                isActive ? 'text-blue-600' : 'text-slate-400 opacity-60'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
