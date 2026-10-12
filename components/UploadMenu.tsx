import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader, MonitorUp, Upload } from 'lucide-react';
import { isDriveConfigured } from '../driveService';

interface UploadMenuProps {
  isUploading: boolean;
  onPickComputerFile: (file: File) => void;
  onPickDrive: () => void;
}

const DriveLogo: React.FC = () => (
  <svg viewBox="0 0 87.3 78" className="w-4 h-4" aria-hidden="true">
    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#ea4335" />
    <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
    <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
    <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
  </svg>
);

/** Upload button with an anchored menu: From computer / From Google Drive. */
const UploadMenu: React.FC<UploadMenuProps> = ({ isUploading, onPickComputerFile, onPickDrive }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const driveReady = isDriveConfigured();

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

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={isUploading}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-app-dark text-white text-sm font-bold shadow-sm transition-colors ${
          isUploading ? 'cursor-wait opacity-60' : 'hover:bg-app-deep'
        }`}
      >
        {isUploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
        <span>{isUploading ? 'Uploading…' : 'Upload'}</span>
        {!isUploading && <ChevronDown size={16} className="opacity-70" />}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,video/*,audio/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onPickComputerFile(file);
        }}
      />

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] w-64 z-40 rounded-xl bg-white border border-app-slate/15 shadow-xl overflow-hidden py-1 origin-top-right animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[52px] text-left hover:bg-app-slate/5 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-app-bg flex items-center justify-center shrink-0">
              <MonitorUp size={16} className="text-app-deep" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-app-dark leading-tight">From computer</span>
              <span className="block text-[11px] font-medium text-app-slate opacity-70">Images, PDF, video, audio</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!driveReady}
            onClick={() => {
              setOpen(false);
              onPickDrive();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[52px] text-left hover:bg-app-slate/5 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <span className="w-8 h-8 rounded-lg bg-app-bg flex items-center justify-center shrink-0">
              <DriveLogo />
            </span>
            <span>
              <span className="block text-sm font-semibold text-app-dark leading-tight">From Google Drive</span>
              <span className="block text-[11px] font-medium text-app-slate opacity-70">
                {driveReady ? 'Docs, Slides, PDF, images' : 'Not set up yet'}
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadMenu;
