import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList, Grid3x3, Plus, MoreHorizontal, ListChecks, Folder, Settings, X } from 'lucide-react';
import { useBodyScrollLock } from '../useBodyScrollLock';

interface BottomNavProps {
  currentView: string;
  setView: (view: string) => void;
  onAdd?: () => void;
  isReadOnly?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView, onAdd, isReadOnly }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  useBodyScrollLock(moreOpen);

  const primaryItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'logs', label: 'Log', icon: ClipboardList },
  ];
  const secondaryItems = [
    { id: 'coverage', label: 'Coverage', icon: Grid3x3 },
  ];
  const moreItems = [
    { id: 'checklists', label: 'Checklists', icon: ListChecks },
    { id: 'artifacts', label: 'Artifact Vault', icon: Folder },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const moreActive = moreItems.some((i) => i.id === currentView);

  const navBtn = (item: { id: string; label: string; icon: React.ElementType }) => {
    const isActive = currentView === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => setView(item.id)}
        className="flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all active:scale-90"
      >
        {/* Material 3 active indicator: a wide fully-rounded pill around the
            icon only — the label stays outside it, per spec. */}
        <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-app-dark text-white shadow-lg' : 'text-app-slate/60'}`}>
          <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-semibold text-center leading-none ${isActive ? 'text-app-dark' : 'text-app-slate/60'}`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* More sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-app-dark/30" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border-t border-app-slate/15 p-4 pb-8 shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs font-semibold text-app-slate">More</p>
              <button onClick={() => setMoreOpen(false)} className="text-app-slate p-1"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setView(item.id); setMoreOpen(false); }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${
                      isActive ? 'bg-app-dark text-white border-app-dark' : 'bg-app-bg text-app-deep border-app-slate/15'
                    }`}
                  >
                    <Icon size={24} strokeWidth={2} />
                    <span className="text-[11px] font-semibold text-center leading-none">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-app-slate/15 z-50 pb-safe">
        <nav className="flex items-center justify-around h-16 px-1">
          {primaryItems.map(navBtn)}

          {/* Prominent Add button */}
          {!isReadOnly && (
            <button
              onClick={onAdd}
              aria-label="Add entry"
              className="flex-1 flex items-center justify-center"
            >
              <div className="w-12 h-12 -mt-6 bg-app-dark rounded-2xl shadow-xl shadow-app-dark/30 text-white flex items-center justify-center active:scale-90 transition-all border-4 border-white">
                <Plus size={22} strokeWidth={2.5} />
              </div>
            </button>
          )}

          {secondaryItems.map(navBtn)}

          {/* More */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all active:scale-90"
          >
            <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all ${moreActive ? 'bg-app-dark text-white shadow-lg' : 'text-app-slate/60'}`}>
              <MoreHorizontal size={24} strokeWidth={moreActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-semibold text-center leading-none ${moreActive ? 'text-app-dark' : 'text-app-slate/60'}`}>
              More
            </span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default BottomNav;
