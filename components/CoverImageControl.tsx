import React, { useRef, useState } from 'react';
import { ImagePlus, Loader, Trash2 } from 'lucide-react';
import type { Artifact } from '../types';
import { resizeImageToJpeg } from '../imageUtils';
import { deleteFileFromStorage, uploadFileToStorage } from '../storageService';

interface CoverImageControlProps {
  artifact: Artifact;
  /** Signed-in owner's uid; covers can only be changed by the owner. */
  userId?: string;
  canEdit: boolean;
  /** Called with the new cover URL, or undefined when the cover is removed. */
  onChange: (coverUrl: string | undefined) => void;
}

/**
 * Lets the owner pick a cover image for any artifact (PDF, video, audio, or
 * even a photo). The cover replaces the automatic preview in the dashboard
 * carousel and the Portfolio list; the real file is untouched.
 */
const CoverImageControl: React.FC<CoverImageControlProps> = ({ artifact, userId, canEdit, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const cover = artifact.coverUrl;
  const showCover = !!cover && cover !== failedUrl;

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    if (!userId) {
      setError('You must be signed in to change the cover.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await resizeImageToJpeg(file, 1200, 0.85);
      let url: string;
      if (userId === 'demo') {
        url = URL.createObjectURL(blob); // dev demo: no Storage
      } else {
        // Unique name per cover so a replaced image is never served stale.
        const coverFile = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
        const result = await uploadFileToStorage(userId, coverFile, `${artifact.id}-cover-${Date.now()}`);
        if (!result.success || !result.url) {
          setError(result.error || 'The cover could not be uploaded.');
          return;
        }
        url = result.url;
      }
      if (cover && userId !== 'demo') void deleteFileFromStorage(cover);
      setFailedUrl(null);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The cover could not be set.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    if (cover && userId && userId !== 'demo') void deleteFileFromStorage(cover);
    setError(null);
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImagePlus size={14} className="text-app-slate" strokeWidth={2.5} />
        <label className="text-xs font-bold text-app-slate">Cover image</label>
      </div>
      <div className="flex items-center gap-3">
        <span className="relative w-24 aspect-[16/10] rounded-lg overflow-hidden bg-app-bg border border-app-slate/15 flex items-center justify-center shrink-0">
          {showCover ? (
            <img
              src={cover}
              alt="Cover"
              referrerPolicy="no-referrer"
              onError={() => setFailedUrl(cover ?? null)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-[10px] font-semibold text-app-slate opacity-60 px-2 text-center">Automatic</span>
          )}
        </span>
        <div className="min-w-0 space-y-1.5">
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-app-slate/15 text-app-dark text-sm font-semibold hover:bg-app-slate/5 transition-colors disabled:opacity-60"
              >
                {busy ? <Loader size={14} className="animate-spin" /> : <ImagePlus size={14} className="text-app-slate" />}
                {cover ? 'Change' : 'Add cover'}
              </button>
              {cover && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={busy}
                  aria-label="Remove cover image"
                  className="p-2.5 min-h-[44px] rounded-lg text-app-slate hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { void handlePick(e.target.files?.[0]); e.target.value = ''; }}
              />
            </div>
          ) : null}
          <p className="text-[11px] font-medium text-app-slate opacity-70">
            {cover ? 'Shown on the dashboard and in your Portfolio list.' : 'Shown instead of the automatic preview.'}
          </p>
          {error && <p role="alert" className="text-[11px] font-semibold text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default CoverImageControl;
