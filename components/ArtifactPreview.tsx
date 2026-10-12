import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, Film, ImageOff, Music } from 'lucide-react';
import type { Artifact } from '../types';
import { canEmbedPdf, kindLabel, resolveArtifactKind } from '../lib/artifact-preview';

/**
 * Legacy artifacts stored inline base64 `data:` URLs. Browsers block top-level
 * navigation to those, so "Open" and "Download" need a blob: URL instead.
 */
function useViewableUrl(data: string): string {
  const [blobUrl, setBlobUrl] = useState<{ source: string; url: string } | null>(null);

  useEffect(() => {
    if (!data.startsWith('data:')) return;
    let revoked = false;
    let created: string | undefined;
    fetch(data)
      .then(r => r.blob())
      .then(blob => {
        if (revoked) return;
        created = URL.createObjectURL(blob);
        setBlobUrl({ source: data, url: created });
      })
      .catch(() => undefined);
    return () => {
      revoked = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [data]);

  if (!data.startsWith('data:')) return data;
  return blobUrl?.source === data ? blobUrl.url : data;
}

const ActionButtons: React.FC<{ url: string; name: string; canDownload: boolean }> = ({ url, name, canDownload }) => (
  <div className="flex flex-wrap items-center justify-center gap-2">
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-app-dark text-white text-sm font-bold hover:bg-app-deep transition-colors"
    >
      <ExternalLink size={16} /> Open in new tab
    </a>
    {canDownload && (
      <a
        href={url}
        download={name}
        className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-app-slate/15 text-app-slate text-sm font-semibold hover:bg-app-slate/5 transition-colors"
      >
        <Download size={16} /> Download
      </a>
    )}
  </div>
);

/**
 * Preview body for the artifact modal. Always offers an Open action, so a file
 * the browser can't render inline is still reachable.
 */
const ArtifactPreview: React.FC<{ artifact: Artifact }> = ({ artifact }) => {
  const kind = resolveArtifactKind(artifact);
  const url = useViewableUrl(artifact.data);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = failedUrl === url;
  const hasFile = artifact.data.length > 0;
  // Only same-origin/blob/data files honour the `download` attribute.
  const canDownload = artifact.data.startsWith('data:') || url.startsWith('blob:');

  const frame = 'bg-app-bg rounded-xl border border-app-slate/15 overflow-hidden';
  const message = (icon: React.ReactNode, title: string, detail?: string) => (
    <div className={`${frame} aspect-[16/10] flex flex-col items-center justify-center gap-3 px-6 text-center`}>
      <span className="text-app-slate opacity-60">{icon}</span>
      <div>
        <p className="text-sm font-bold text-app-dark">{title}</p>
        {detail && <p className="text-xs font-medium text-app-slate opacity-70 mt-0.5">{detail}</p>}
      </div>
      {hasFile && <ActionButtons url={url} name={artifact.name} canDownload={canDownload} />}
    </div>
  );

  if (!hasFile) {
    return message(<FileText size={48} strokeWidth={1.25} />, 'No file attached', 'This artifact has no stored file.');
  }

  if (kind === 'image' && !failed) {
    return (
      <div className="space-y-3">
        <div className={`${frame} flex items-center justify-center`}>
          <img
            src={url}
            alt={artifact.name}
            referrerPolicy="no-referrer"
            onError={() => setFailedUrl(url)}
            className="max-w-full max-h-[60vh] object-contain"
          />
        </div>
        <ActionButtons url={url} name={artifact.name} canDownload={canDownload} />
      </div>
    );
  }
  if (kind === 'image') {
    return message(<ImageOff size={48} strokeWidth={1.25} />, "This image couldn't be loaded", 'Open it in a new tab to check the file.');
  }

  if (kind === 'video') {
    return (
      <div className="space-y-3">
        <div className={`${frame} bg-black`}>
          <video src={url} controls playsInline className="w-full max-h-[60vh]" onError={() => setFailedUrl(url)} />
        </div>
        {failed ? message(<Film size={48} strokeWidth={1.25} />, "This video couldn't be played") : (
          <ActionButtons url={url} name={artifact.name} canDownload={canDownload} />
        )}
      </div>
    );
  }

  if (kind === 'audio') {
    return (
      <div className="space-y-3">
        <div className={`${frame} p-6 flex items-center gap-4`}>
          <Music size={28} className="text-app-bright shrink-0" />
          <audio src={url} controls className="w-full" onError={() => setFailedUrl(url)} />
        </div>
        <ActionButtons url={url} name={artifact.name} canDownload={canDownload} />
      </div>
    );
  }

  if (kind === 'pdf') {
    const embed = canEmbedPdf(navigator.userAgent, navigator.maxTouchPoints);
    return (
      <div className="space-y-3">
        {embed ? (
          <div className={`${frame} h-[60vh]`}>
            <iframe src={url} title={artifact.name} className="w-full h-full" />
          </div>
        ) : (
          message(<FileText size={48} strokeWidth={1.25} />, 'PDF document', 'Tap Open to read it in your browser.')
        )}
        {embed && <ActionButtons url={url} name={artifact.name} canDownload={canDownload} />}
      </div>
    );
  }

  return message(
    <FileText size={48} strokeWidth={1.25} />,
    `${kindLabel(kind)} can't be previewed here`,
    'Open it in a new tab to view it.'
  );
};

export default ArtifactPreview;
