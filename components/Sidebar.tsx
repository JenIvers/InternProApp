import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList, Grid3x3, Folder, UsersRound, Share2, Check } from 'lucide-react';
import logo from '../bethel-logo.png';
import ProfileMenu from './ProfileMenu';
import type { ViewId } from '../lib/routes';

interface SidebarProps {
  currentView: string;
  setView: (view: ViewId) => void;
  isReadOnly?: boolean;
  userId?: string;
  user?: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'mentors', label: 'Mentor Spotlight', icon: UsersRound },
  { id: 'logs', label: 'Activity Log', icon: ClipboardList },
  { id: 'competencies', label: 'Competencies', icon: Grid3x3 },
  { id: 'portfolio', label: 'Portfolio', icon: Folder },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isReadOnly, userId, user }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!userId) return;
    const url = `${window.location.origin}/?view=${userId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-64 bg-white border-r border-app-slate/15 h-screen fixed left-0 top-0 hidden md:flex flex-col z-50">
      <div className="px-6 pt-6 pb-3 flex items-center gap-3">
        <img src={logo} alt="Bethel University" className="w-9 h-9 object-contain" />
        <h1 className="text-xl font-black tracking-tighter bg-gradient-to-br from-app-dark via-app-deep to-app-bright bg-clip-text text-transparent">
          InternPro
        </h1>
      </div>

      <div className="px-4 pb-3 border-b border-app-slate/10">
        {user ? (
          <ProfileMenu
            variant="card"
            user={user}
            isReadOnly={isReadOnly}
            onOpenSettings={() => setView('settings')}
          />
        ) : (
          <p className="px-2.5 py-3 text-[11px] text-app-slate font-semibold opacity-70">Bethel University</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center space-x-3 px-4 py-3 min-h-[44px] rounded-xl transition-colors ${
                isActive
                  ? 'bg-app-dark text-white font-semibold'
                  : 'text-app-slate hover:bg-app-slate/5 hover:text-app-dark'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {!isReadOnly && (
        <div className="p-5 border-t border-app-slate/10">
          <button
            onClick={handleShare}
            className="w-full min-h-[44px] border border-app-slate/15 text-app-slate hover:bg-app-slate/5 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check size={14} strokeWidth={3} /> : <Share2 size={14} strokeWidth={3} />}
            {copied ? 'Link Copied' : 'Share Portfolio'}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
