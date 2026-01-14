import React, { useState } from 'react';
import { LayoutDashboard, Clock, Target, Folder, School, LogOut, Share2, Check } from 'lucide-react';
import { signOut } from '../authService';
import logo from '../bethel-logo.png';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isReadOnly?: boolean;
  userId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isReadOnly, userId }) => {
  const [copied, setCopied] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Activity Log', icon: Clock },
    { id: 'competencies', label: 'Competencies', icon: Target },
    { id: 'artifacts', label: 'Artifact Vault', icon: Folder },
    { id: 'sites', label: 'Sites', icon: School },
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
      <div className="p-10 border-b border-white/20 flex flex-col items-center text-center">
        <img src={logo} alt="Bethel University" className="w-20 mb-6 drop-shadow-sm" />
        <h1 className="text-2xl font-black text-app-dark bg-gradient-to-br from-app-dark via-app-deep to-app-bright bg-clip-text text-transparent tracking-tighter">
          InternPro
        </h1>
        <p className="text-[10px] text-app-slate font-black uppercase tracking-[0.25em] mt-2 opacity-70">
          Bethel University
        </p>
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