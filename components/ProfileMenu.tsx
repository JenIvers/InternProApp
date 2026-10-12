import React, { useEffect, useRef, useState } from 'react';
import { ChevronsUpDown, LogOut, Settings } from 'lucide-react';
import Avatar from './Avatar';
import { signOut } from '../authService';

interface ProfileMenuProps {
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  isReadOnly?: boolean;
  onOpenSettings: () => void;
  /** 'card' = full-width profile card (sidebar); 'avatar' = compact button (mobile header). */
  variant: 'card' | 'avatar';
}

/**
 * The profile card / avatar that opens the account popover: sync status,
 * Settings, and Sign out. Replaces the sidebar's standalone Settings item,
 * Status card and Sign out button.
 */
const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, isReadOnly, onOpenSettings, variant }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const name = user?.displayName || user?.email || 'Account';
  const statusLabel = isReadOnly ? 'Viewer mode' : 'Cloud syncing';
  const statusDetail = isReadOnly ? 'You are viewing a shared portfolio' : 'Changes save automatically';

  const popoverPosition =
    variant === 'card'
      ? 'left-0 right-0 top-[calc(100%+4px)] origin-top'
      : 'right-0 top-[calc(100%+6px)] w-64 origin-top-right';

  return (
    <div ref={rootRef} className="relative">
      {variant === 'card' ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="w-full flex items-center gap-3 p-2.5 min-h-[56px] rounded-xl hover:bg-app-slate/5 transition-colors text-left"
        >
          <Avatar photoURL={user?.photoURL} name={user?.displayName} email={user?.email} className="w-10 h-10 text-sm" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-app-dark truncate">{name}</span>
            <span className="block text-[11px] font-medium text-app-slate opacity-70 truncate">
              {user?.displayName && user?.email ? user.email : 'Personalized portfolio'}
            </span>
          </span>
          <ChevronsUpDown size={16} className="text-app-slate shrink-0" />
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className="p-1 -mr-1 rounded-full transition-transform active:scale-90"
        >
          <Avatar photoURL={user?.photoURL} name={user?.displayName} email={user?.email} className="w-9 h-9 text-xs" />
        </button>
      )}

      {open && (
        <div
          role="menu"
          className={`absolute z-[70] rounded-xl bg-white border border-app-slate/15 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${popoverPosition}`}
        >
          {variant === 'avatar' && (
            <div className="px-4 py-3 border-b border-app-slate/10">
              <p className="text-sm font-bold text-app-dark truncate">{name}</p>
              {user?.displayName && user?.email && (
                <p className="text-[11px] font-medium text-app-slate opacity-70 truncate">{user.email}</p>
              )}
            </div>
          )}
          <div className="px-4 py-3 border-b border-app-slate/10 flex items-center gap-2.5">
            <span className="relative flex w-2.5 h-2.5 shrink-0">
              {!isReadOnly && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-bright opacity-50" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isReadOnly ? 'bg-amber-400' : 'bg-app-bright'}`} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-app-dark leading-tight">{statusLabel}</p>
              <p className="text-[11px] font-medium text-app-slate opacity-70">{statusDetail}</p>
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-app-dark hover:bg-app-slate/5 text-left transition-colors"
          >
            <Settings size={16} className="text-app-slate" />
            Settings
          </button>
          {!isReadOnly && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-red-600 hover:bg-red-50 text-left border-t border-app-slate/10 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
