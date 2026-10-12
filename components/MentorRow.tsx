import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { InternshipLog, Mentor } from '../types';
import MentorPhoto from './MentorPhoto';
import { mentorCardText, mentorGridLayout, type MentorCardVariant } from '../lib/mentors';
import { useMediaQuery } from '../useMediaQuery';

interface MentorRowProps {
  /** Mentors to show, already filtered to the pinned ones and the chosen count. */
  mentors: Mentor[];
  logs: InternshipLog[];
  onOpenMentor: (id: string) => void;
  onOpenAll: () => void;
}

const GAP_PX = 12;
const MAX_CARD_PX = 232;

const MentorCard: React.FC<{
  mentor: Mentor;
  logs: InternshipLog[];
  variant: MentorCardVariant;
  cols: number;
  onOpen: () => void;
}> = ({ mentor, logs, variant, cols, onOpen }) => {
  // Equal widths for any column count; a short last row stays centred at the same width.
  const style: React.CSSProperties = {
    width: `calc((100% - ${(cols - 1) * GAP_PX}px) / ${cols})`,
    maxWidth: MAX_CARD_PX,
  };
  const label = [mentor.name, mentor.title, mentor.organization].filter(Boolean).join(', ');

  // Role and school/district are always shown, at every density.
  const lines = (
    <>
      <span className="block text-xs font-bold text-app-dark truncate leading-tight">{mentor.name}</span>
      <span className="block text-[11px] font-medium text-app-slate truncate leading-tight">{mentor.title}</span>
      <span className="block text-[11px] font-medium text-app-slate/70 truncate leading-tight">{mentor.organization}</span>
    </>
  );

  if (variant === 'compact') {
    return (
      <button type="button" onClick={onOpen} style={style} title={label}
        className="flex items-center gap-2.5 rounded-xl border border-app-slate/15 bg-white p-2 text-left hover:shadow-md transition-shadow min-w-0">
        <MentorPhoto mentor={mentor} className="w-10 h-10 rounded-full shrink-0 text-xs" />
        <span className="min-w-0">{lines}</span>
      </button>
    );
  }
  if (variant === 'mid') {
    return (
      <button type="button" onClick={onOpen} style={style} title={label}
        className="flex items-stretch gap-3 rounded-xl border border-app-slate/15 bg-white p-2.5 text-left hover:shadow-md transition-shadow min-w-0">
        <MentorPhoto mentor={mentor} className="w-14 aspect-[4/5] rounded-lg shrink-0 text-xs" />
        <span className="min-w-0 self-center">{lines}</span>
      </button>
    );
  }
  const text = mentorCardText(mentor, logs);
  return (
    <button type="button" onClick={onOpen} style={style} title={label}
      className="rounded-2xl border border-app-slate/15 bg-white overflow-hidden text-left hover:shadow-xl transition-shadow flex flex-col min-w-0">
      <MentorPhoto mentor={mentor} className="w-full aspect-square" />
      <span className="block p-4">
        <span className="block text-sm font-bold text-app-dark truncate">{mentor.name}</span>
        <span className="block text-xs font-medium text-app-slate truncate">{mentor.title}</span>
        <span className="block text-xs font-medium text-app-slate/70 truncate">{mentor.organization}</span>
        {text && <span className="block text-xs text-app-dark/70 leading-relaxed mt-2 line-clamp-2">{text}</span>}
      </span>
    </button>
  );
};

/** Static, evenly spaced row of pinned mentors that gets denser (never taller) as more are shown. */
const MentorRow: React.FC<MentorRowProps> = ({ mentors, logs, onOpenMentor, onOpenAll }) => {
  const narrow = useMediaQuery('(max-width: 767px)');
  if (mentors.length === 0) return null;
  const { cols, variant } = mentorGridLayout(mentors.length, narrow);

  return (
    <section aria-labelledby="dash-mentors-heading">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 id="dash-mentors-heading" className="text-sm font-bold text-app-dark">Mentor Spotlight</h2>
        <button type="button" onClick={onOpenAll}
          className="flex items-center gap-1 text-[11px] font-bold text-app-bright hover:text-app-deep transition-colors">
          All mentors <ChevronRight size={12} />
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {mentors.map(m => (
          <MentorCard key={m.id} mentor={m} logs={logs} variant={variant} cols={cols} onOpen={() => onOpenMentor(m.id)} />
        ))}
      </div>
    </section>
  );
};

export default MentorRow;
