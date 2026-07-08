import React, { useMemo, useState } from 'react';
import { AppChecklists, InternshipLog } from '../types';
import { SUGGESTED_ACTIVITIES, DELIVERABLES } from '../lib/reference/guide';
import { CheckSquare, Square, Link2, X, ClipboardList, ListChecks } from 'lucide-react';

export interface ChecklistsViewProps {
  checklists: AppChecklists;
  logs: InternshipLog[];
  isReadOnly: boolean;
  onUpdateChecklists: (checklists: AppChecklists) => void;
}

const emptyChecklists: AppChecklists = { suggestedActivities: {}, deliverables: {} };

const ChecklistsView: React.FC<ChecklistsViewProps> = ({ checklists, logs, isReadOnly, onUpdateChecklists }) => {
  const data = checklists ?? emptyChecklists;
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const activitiesDone = useMemo(
    () => SUGGESTED_ACTIVITIES.filter(a => data.suggestedActivities?.[a.id]?.done).length,
    [data.suggestedActivities]
  );
  const deliverablesDone = useMemo(
    () => DELIVERABLES.filter(d => data.deliverables?.[d.id]?.done).length,
    [data.deliverables]
  );

  const toggleActivity = (id: string) => {
    if (isReadOnly) return;
    const current = data.suggestedActivities?.[id];
    onUpdateChecklists({
      ...data,
      suggestedActivities: {
        ...data.suggestedActivities,
        [id]: { done: !current?.done, linkedEntryIds: current?.linkedEntryIds ?? [] },
      },
    });
  };

  const toggleLinkedEntry = (activityId: string, entryId: string) => {
    if (isReadOnly) return;
    const current = data.suggestedActivities?.[activityId] ?? { done: false, linkedEntryIds: [] };
    const linked = current.linkedEntryIds ?? [];
    const nextLinked = linked.includes(entryId) ? linked.filter(id => id !== entryId) : [...linked, entryId];
    onUpdateChecklists({
      ...data,
      suggestedActivities: {
        ...data.suggestedActivities,
        [activityId]: { ...current, linkedEntryIds: nextLinked },
      },
    });
  };

  const toggleDeliverable = (id: string) => {
    if (isReadOnly) return;
    const current = data.deliverables?.[id];
    onUpdateChecklists({
      ...data,
      deliverables: {
        ...data.deliverables,
        [id]: { done: !current?.done, note: current?.note ?? '' },
      },
    });
  };

  const updateDeliverableNote = (id: string, note: string) => {
    if (isReadOnly) return;
    const current = data.deliverables?.[id] ?? { done: false };
    onUpdateChecklists({
      ...data,
      deliverables: { ...data.deliverables, [id]: { ...current, note } },
    });
  };

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [logs]
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8 px-1">
      <div>
        <h2 className="text-2xl font-bold text-app-dark tracking-tight">Cross-check vs. Guide</h2>
        <p className="text-app-slate text-sm">Track the Guide's suggested activities and process deliverables.</p>
      </div>

      {/* Suggested Activities */}
      <section className="bg-white rounded-xl border border-app-dark/10 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-app-bg border-b border-app-dark/10">
          <div className="flex items-center gap-2">
            <ListChecks size={14} className="text-app-slate" strokeWidth={2.5} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-app-slate">Suggested Activities</h3>
          </div>
          <span className="text-xs font-bold text-app-slate tabular-nums">
            {activitiesDone} / {SUGGESTED_ACTIVITIES.length}
          </span>
        </div>
        <ul className="divide-y divide-app-dark/5">
          {SUGGESTED_ACTIVITIES.map(activity => {
            const entry = data.suggestedActivities?.[activity.id];
            const linkedIds = entry?.linkedEntryIds ?? [];
            const isPicking = pickerFor === activity.id;
            return (
              <li key={activity.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleActivity(activity.id)}
                    disabled={isReadOnly}
                    className="mt-0.5 shrink-0 p-1.5 -m-1.5 rounded-lg disabled:opacity-50"
                    aria-label={entry?.done ? 'Mark not done' : 'Mark done'}
                  >
                    {entry?.done ? (
                      <CheckSquare size={20} className="text-app-bright" strokeWidth={2.5} />
                    ) : (
                      <Square size={20} className="text-app-slate/40" strokeWidth={2.5} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold text-app-dark ${entry?.done ? 'line-through opacity-60' : ''}`}>
                      {activity.title}
                    </p>
                    <p className="text-xs text-app-slate mt-0.5">{activity.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {linkedIds.map(id => {
                        const log = logs.find(l => l.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-app-bg text-[11px] font-semibold text-app-slate border border-app-dark/10"
                          >
                            {log ? `${log.date} · ${log.title || log.activity || log.description}` : id}
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => toggleLinkedEntry(activity.id, id)}
                                className="hover:text-rose-600"
                                aria-label="Unlink entry"
                              >
                                <X size={11} strokeWidth={3} />
                              </button>
                            )}
                          </span>
                        );
                      })}
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => setPickerFor(isPicking ? null : activity.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-app-bright hover:bg-app-bright/10"
                        >
                          <Link2 size={11} strokeWidth={3} />
                          {isPicking ? 'Close' : 'Link entry'}
                        </button>
                      )}
                    </div>
                    {isPicking && !isReadOnly && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-app-dark/10 bg-app-bg/60">
                        {sortedLogs.length === 0 && (
                          <p className="text-xs text-app-slate px-3 py-2">No log entries yet.</p>
                        )}
                        {sortedLogs.map(log => (
                          <button
                            key={log.id}
                            type="button"
                            onClick={() => toggleLinkedEntry(activity.id, log.id)}
                            className={`w-full text-left px-3 py-2.5 min-h-[40px] text-xs border-b border-app-dark/5 last:border-0 hover:bg-white transition-colors flex items-center justify-between gap-2 ${
                              linkedIds.includes(log.id) ? 'bg-app-bright/10' : ''
                            }`}
                          >
                            <span className="truncate">
                              <span className="font-bold text-app-dark">{log.date}</span>{' '}
                              <span className="text-app-slate">{log.title || log.activity || log.description}</span>
                            </span>
                            {linkedIds.includes(log.id) && <CheckSquare size={14} className="text-app-bright shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Process Deliverables */}
      <section className="bg-white rounded-xl border border-app-dark/10 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-app-bg border-b border-app-dark/10">
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-app-slate" strokeWidth={2.5} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-app-slate">Process Deliverables</h3>
          </div>
          <span className="text-xs font-bold text-app-slate tabular-nums">
            {deliverablesDone} / {DELIVERABLES.length}
          </span>
        </div>
        <ul className="divide-y divide-app-dark/5">
          {DELIVERABLES.map(deliverable => {
            const entry = data.deliverables?.[deliverable.id];
            return (
              <li key={deliverable.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDeliverable(deliverable.id)}
                    disabled={isReadOnly}
                    className="mt-0.5 shrink-0 p-1.5 -m-1.5 rounded-lg disabled:opacity-50"
                    aria-label={entry?.done ? 'Mark not done' : 'Mark done'}
                  >
                    {entry?.done ? (
                      <CheckSquare size={20} className="text-app-bright" strokeWidth={2.5} />
                    ) : (
                      <Square size={20} className="text-app-slate/40" strokeWidth={2.5} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold text-app-dark ${entry?.done ? 'line-through opacity-60' : ''}`}>
                      {deliverable.title}
                    </p>
                    <p className="text-xs text-app-slate mt-0.5">{deliverable.description}</p>
                    <input
                      type="text"
                      value={entry?.note ?? ''}
                      onChange={e => updateDeliverableNote(deliverable.id, e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Optional note (e.g. filed date, location)..."
                      className="mt-2 w-full px-3 py-2.5 text-base sm:text-xs rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 disabled:opacity-50"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      {isReadOnly && (
        <p className="text-center text-xs text-app-slate/60 uppercase tracking-widest font-bold">Read-only view</p>
      )}
    </div>
  );
};

export default ChecklistsView;
