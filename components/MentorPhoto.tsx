import React, { useState } from 'react';
import type { Mentor } from '../types';
import { photoStyle } from '../lib/mentors';

interface MentorPhotoProps {
  mentor: Pick<Mentor, 'name' | 'photoUrl' | 'photoFocus' | 'photoZoom'>;
  /** Overrides mentor.photoUrl (e.g. an unsaved local preview in the editor). */
  previewUrl?: string;
  /** Sizing/shape classes for the frame; the photo always fills it. */
  className?: string;
}

function hueFor(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function initialsOf(name: string): string {
  const parts = name.replace(/^(dr|mr|mrs|ms|mx)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

/**
 * A mentor portrait that never distorts or crops a face out: the image is
 * `object-cover` anchored to the mentor's saved focal point, optionally zoomed
 * around it. With no (or a broken) photo it falls back to a tinted initials tile.
 */
const MentorPhoto: React.FC<MentorPhotoProps> = ({ mentor, previewUrl, className = '' }) => {
  const url = previewUrl ?? mentor.photoUrl;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = !!url && url !== failedUrl;
  const hue = hueFor(mentor.name || '?');

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {showPhoto ? (
        <img
          src={url}
          alt={mentor.name}
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
          className="absolute inset-0 w-full h-full object-cover select-none"
          style={photoStyle(mentor)}
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center text-white/90 font-bold"
          style={{ background: `linear-gradient(160deg, hsl(${hue} 38% 62%), hsl(${hue} 40% 34%))`, fontSize: '1.25em' }}
          aria-hidden="true"
        >
          {initialsOf(mentor.name)}
        </span>
      )}
    </span>
  );
};

export default MentorPhoto;
