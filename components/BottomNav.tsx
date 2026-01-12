
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
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 z-50 pb-safe">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full space-y-1 group transition-all"
            >
              <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'group-active:scale-95'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
