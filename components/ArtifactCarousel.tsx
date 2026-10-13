import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Film, ImageIcon, Music, Pause, Play } from 'lucide-react';
import type { Artifact } from '../types';
import { kindLabel, resolveArtifactKind, type ArtifactKind } from '../lib/artifact-preview';

interface ArtifactCarouselProps {
  artifacts: Artifact[];
  onOpenArtifact: (id: string) => void;
  onOpenPortfolio: () => void;
}

const GAP_PX = 16;
const AUTOPLAY_PX_PER_SECOND = 38;
const MAX_SLIDES = 12;

type PlayMode = 'auto' | 'on' | 'off';

const KIND_ICON: Record<ArtifactKind, React.ElementType> = {
  image: ImageIcon,
  pdf: FileText,
  video: Film,
  audio: Music,
  other: FileText,
};

const Slide: React.FC<{ artifact: Artifact; onOpen: () => void; hidden?: boolean }> = ({ artifact, onOpen, hidden }) => {
  const kind = resolveArtifactKind(artifact);
  const Icon = KIND_ICON[kind];
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const showImage = kind === 'image' && artifact.data.length > 0 && !imageFailed;
  const showVideo = kind === 'video' && artifact.data.length > 0 && !videoFailed;

  return (
    <button
      type="button"
      onClick={onOpen}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      className="group relative shrink-0 w-[82%] sm:w-[22rem] lg:w-[26rem] aspect-[16/10] rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-shadow ring-1 ring-app-slate/15 bg-app-deep"
    >
      {showImage ? (
        <img
          src={artifact.data}
          alt=""
          draggable={false}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : showVideo ? (
        // Browsers paint the first frame of a video once its metadata loads; the
        // #t fragment nudges iOS Safari into showing a frame instead of black.
        <>
          <span className="absolute inset-0 bg-gradient-to-br from-app-deep to-app-dark" />
          <video
            src={`${artifact.data}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            tabIndex={-1}
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-14 h-14 rounded-full bg-white/85 text-app-dark flex items-center justify-center shadow-lg">
              <Play size={22} className="ml-0.5 fill-current" />
            </span>
          </span>
        </>
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-app-deep to-app-dark flex items-center justify-center">
          <Icon size={56} strokeWidth={1.25} className="text-white/25" />
        </span>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-app-dark/85 via-app-dark/10 to-transparent" />
      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-[11px] font-bold text-app-dark">
        <Icon size={12} />
        {kindLabel(kind)}
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <span className="block text-[11px] font-semibold text-white/70 mb-1">{artifact.uploadDate}</span>
        <span className="block text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">{artifact.name}</span>
      </span>
    </button>
  );
};

/**
 * Dashboard Portfolio carousel. Still by default. Hovering it with a mouse
 * glides it forward; the play/pause button is a persistent choice that wins
 * over hover; reduced-motion users never get automatic movement. When there
 * are enough slides to overflow, the track loops seamlessly (the slides are
 * rendered twice and the scroll position wraps by exactly one period).
 */
const ArtifactCarousel: React.FC<ArtifactCarouselProps> = ({ artifacts, onOpenArtifact, onOpenPortfolio }) => {
  const slides = artifacts.slice().reverse().slice(0, MAX_SLIDES); // newest first
  const n = slides.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<PlayMode>('auto');
  const [loop, setLoop] = useState(false);
  const [index, setIndex] = useState(0);

  // Live values read by the animation loop without re-subscribing it.
  const modeRef = useRef<PlayMode>('auto');
  const hoverRef = useRef(false);
  const visibleRef = useRef(true);
  const lastUserScrollRef = useRef(0);
  const pendingRef = useRef<number | null>(null);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const slideAt = useCallback((i: number): HTMLElement | undefined => {
    return trackRef.current?.children[i] as HTMLElement | undefined;
  }, []);

  // Loop only when the slides overflow the track (otherwise there's nothing to scroll).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || n === 0) return;
    const measure = () => {
      const first = track.children[0] as HTMLElement | undefined;
      if (!first) return;
      const contentWidth = n * (first.offsetWidth + GAP_PX) - GAP_PX;
      setLoop(contentWidth > track.clientWidth + 8);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [n]);

  // Pause when scrolled out of view.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const io = new IntersectionObserver(([entry]) => { visibleRef.current = entry.isIntersecting; });
    io.observe(track);
    return () => io.disconnect();
  }, []);

  const periodOf = useCallback((): number => {
    const a = slideAt(0);
    const b = slideAt(n);
    return a && b ? b.offsetLeft - a.offsetLeft : 0;
  }, [slideAt, n]);

  const currentIndex = useCallback((): number => {
    const track = trackRef.current;
    if (!track) return 0;
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      const d = Math.abs((slideAt(i)?.offsetLeft ?? 0) - track.offsetLeft - track.scrollLeft);
      if (d < bestDistance) { bestDistance = d; best = i; }
    }
    return best;
  }, [n, slideAt]);

  // The animation loop: eased start/stop, constant speed, seamless wrap.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || n === 0) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let velocity = 0;
    let position = track.scrollLeft;
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const playing =
        loop && !reduced && visibleRef.current && !document.hidden &&
        (modeRef.current === 'on' || (modeRef.current === 'auto' && hoverRef.current));
      velocity += ((playing ? AUTOPLAY_PX_PER_SECOND : 0) - velocity) * Math.min(1, dt * 4);

      const userIsScrolling = now - lastUserScrollRef.current < 900;
      if (userIsScrolling || Math.abs(velocity) < 0.5) {
        position = track.scrollLeft; // follow manual scrolling, don't fight it
      } else {
        position += velocity * dt;
        track.scrollLeft = position;
      }
      const period = periodOf();
      if (loop && period > 0 && track.scrollLeft >= period) {
        track.scrollLeft -= period;
        position = track.scrollLeft;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [loop, n, periodOf]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const target = slideAt(i);
    if (!track || !target) return;
    pendingRef.current = i;
    lastUserScrollRef.current = performance.now();
    window.setTimeout(() => { if (pendingRef.current === i) pendingRef.current = null; }, 700);
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  };

  const step = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    let i = pendingRef.current ?? currentIndex();
    if (direction < 0 && i === 0 && loop) {
      track.scrollLeft += periodOf(); // jump one period ahead (identical content), then glide back
      i = n;
    }
    goTo(Math.max(0, Math.min(i + direction, loop ? n * 2 - 1 : n - 1)));
  };

  if (n === 0) {
    return (
      <section aria-labelledby="dash-portfolio-heading">
        <div className="flex items-end justify-between gap-3 mb-3">
          <h2 id="dash-portfolio-heading" className="text-sm font-bold text-app-dark">Portfolio</h2>
          <button type="button" onClick={onOpenPortfolio}
            className="flex items-center gap-1 text-[11px] font-bold text-app-bright hover:text-app-deep transition-colors">
            Open Portfolio <ChevronRight size={12} />
          </button>
        </div>
        <div className="rounded-xl border border-app-slate/15 bg-white px-5 py-6 text-center text-xs text-app-slate opacity-70">
          Evidence you upload to your Portfolio will appear here.
        </div>
      </section>
    );
  }

  const shown = loop ? [...slides, ...slides] : slides;
  const isOn = mode === 'on';

  return (
    <section aria-labelledby="dash-portfolio-heading" aria-roledescription="carousel">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 id="dash-portfolio-heading" className="text-sm font-bold text-app-dark">Portfolio</h2>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onOpenPortfolio}
            className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-app-bright hover:text-app-deep transition-colors">
            Open Portfolio <ChevronRight size={12} />
          </button>
          <span className="hidden sm:inline text-[11px] font-semibold text-app-slate tabular-nums opacity-70 w-10 text-right" aria-live="off">
            {index + 1} / {n}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => step(-1)} aria-label="Previous"
              className="w-9 h-9 rounded-full border border-app-slate/15 bg-white text-app-dark flex items-center justify-center hover:bg-app-slate/5 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next"
              className="w-9 h-9 rounded-full border border-app-slate/15 bg-white text-app-dark flex items-center justify-center hover:bg-app-slate/5 transition-colors">
              <ChevronRight size={16} />
            </button>
            {loop && (
              <button
                type="button"
                onClick={() => setMode(isOn ? 'off' : 'on')}
                aria-label={isOn ? 'Pause autoplay' : 'Play autoplay'}
                aria-pressed={isOn}
                title={isOn ? 'Pause autoplay' : 'Autoplay'}
                className={`ml-1 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isOn ? 'text-app-dark bg-app-slate/10' : 'text-app-slate/70 hover:text-app-dark hover:bg-app-slate/10'
                }`}
              >
                {isOn ? <Pause size={14} /> : <Play size={14} />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0"
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') hoverRef.current = true; }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') hoverRef.current = false; }}
        onScroll={() => setIndex(currentIndex())}
        onTouchStart={() => { lastUserScrollRef.current = performance.now(); }}
        onWheel={() => { lastUserScrollRef.current = performance.now(); }}
      >
        {shown.map((a, i) => (
          <Slide key={`${i < n ? '' : 'clone-'}${a.id}`} artifact={a} hidden={i >= n} onOpen={() => onOpenArtifact(a.id)} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3" role="group" aria-label="Choose slide">
        {slides.map((a, i) => (
          <button key={a.id} type="button" onClick={() => goTo(i)} aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-app-dark' : 'w-1.5 bg-app-slate/30 hover:bg-app-slate/60'}`} />
        ))}
      </div>
    </section>
  );
};

export default ArtifactCarousel;
