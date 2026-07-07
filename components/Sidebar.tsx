import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList, Grid3x3, ListChecks, Folder, Settings, LogOut, Share2, Check } from 'lucide-react';
import { signOut } from '../authService';
import logo from '../bethel-logo.png';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isReadOnly?: boolean;
  userId?: string;
  user?: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isReadOnly, userId, user }) => {
  const [copied, setCopied] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Activity Log', icon: ClipboardList },
    { id: 'coverage', label: 'Coverage', icon: Grid3x3 },
    { id: 'checklists', label: 'Checklists', icon: ListChecks },
    { id: 'artifacts', label: 'Artifact Vault', icon: Folder },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleShare = () => {
    if (!userId) return;
    const url = `${window.location.origin}?view=${userId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-64 glass border-r border-white/30 h-screen fixed left-0 top-0 hidden md:flex flex-col z-50">
      <div className="p-8 border-b border-white/20 flex flex-col items-center text-center">
        <img src={logo} alt="Bethel University" className="w-16 mb-4 drop-shadow-sm" />
        <h1 className="text-2xl font-black text-app-dark bg-gradient-to-br from-app-dark via-app-deep to-app-bright bg-clip-text text-transparent tracking-tighter">
          InternPro
        </h1>
        
        {user ? (
          <div className="mt-4 flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="w-12 h-12 rounded-full border-2 border-app-bright/30 p-0.5 mb-2 shadow-sm">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-app-bright/10 flex items-center justify-center text-app-bright font-black text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <p className="text-[11px] text-app-dark font-bold leading-tight line-clamp-1 px-2">
              {user.displayName || user.email}
            </p>
            <p className="text-[9px] text-app-slate font-black uppercase tracking-widest mt-1 opacity-60">
              Personalized Portfolio
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-app-slate font-black uppercase tracking-[0.25em] mt-2 opacity-70">
            Bethel University
          </p>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-app-dark text-white shadow-xl shadow-[#14293022] font-bold scale-[1.02]'
                  : 'text-app-deep/70 hover:bg-white/50 hover:text-app-dark'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-5 border-t border-white/20 space-y-4">
        {!isReadOnly && (
          <button 
            onClick={handleShare}
            className="w-full bg-app-bright/10 hover:bg-app-bright text-app-bright hover:text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
          >
            {copied ? <Check size={14} strokeWidth={3} /> : <Share2 size={14} strokeWidth={3} />}
            {copied ? 'Link Copied' : 'Share Portfolio'}
          </button>
        )}
        
        <div className="glass-blue rounded-2xl p-4">
          <p className="text-[10px] font-black text-app-deep uppercase tracking-widest mb-1 opacity-60">Status</p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isReadOnly ? 'bg-amber-400' : 'bg-app-bright animate-pulse'} shadow-sm`} />
            <p className="text-xs font-bold text-app-dark">{isReadOnly ? 'Viewer Mode' : 'Cloud Syncing'}</p>
          </div>
        </div>

        {!isReadOnly && (
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-slate/50 hover:text-red-500 transition-colors py-2"
          >
            <LogOut size={12} /> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;