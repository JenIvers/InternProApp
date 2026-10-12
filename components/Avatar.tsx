import React, { useState } from 'react';

interface AvatarProps {
  photoURL?: string | null;
  name?: string | null;
  email?: string | null;
  /** Tailwind size + text classes for the circle, e.g. "w-10 h-10 text-sm". */
  className?: string;
}

/**
 * Profile photo with a letter fallback. Google-hosted photo URLs 403/429 when
 * hot-linked with a Referer header, so we send none, and any load failure
 * falls back to the initial instead of a broken-image icon.
 */
const Avatar: React.FC<AvatarProps> = ({ photoURL, name, email, className = 'w-10 h-10 text-sm' }) => {
  // Remember which URL failed so a refreshed photoURL gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = !!photoURL && photoURL !== failedUrl;
  const initial = (name || email || '?').trim().charAt(0).toUpperCase();

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 bg-app-bright/10 text-app-bright font-bold ${className}`}
    >
      {showPhoto ? (
        <img
          src={photoURL}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(photoURL)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
};

export default Avatar;
