import React, { useEffect, useMemo, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FileDown, X, FileText, ClipboardList, MessageSquare, Loader2 } from 'lucide-react';
import type { AppSettings, InternshipLog } from '../types';
import { buildExportModel, hasMeetingNotes, type ExportMode } from '../lib/export-model';
import LogPdf from './pdf/LogPdf';

/**
 * ExportDialog — modal that produces submission-grade PDFs of the internship
 * log. The user chooses a mode (full / activities-only / meetings-only) and a
 * scope (all entries / the current filtered view). The dialog builds the model
 * via buildExportModel and downloads a named PDF via pdf().toBlob().
 *
 * All domain math lives in lib/export-model; this component only selects
 * options, shows per-mode entry counts, and drives the download.
 */

export interface ExportDialogProps {
  /** Whether the modal is shown. */
  open: boolean;
  /** Close callback. */
  onClose: () => void;
  /** All log entries in the portfolio. */
  logs: InternshipLog[];
  /**
   * The current filtered view (from the LogTable's log-query), when a filter is
   * active. When provided and non-identical to `logs`, the "current filtered
   * view" scope becomes selectable.
   */
  filteredLogs?: InternshipLog[];
  /** Requirement settings (targets, primary bucket, intermediate mapping). */
  settings: AppSettings;
  /** Portfolio owner's name, printed on the PDF. */
  authorName?: string | null;
  /**
   * Read-only viewer/advisor mode. Exports are a read operation, so they remain
   * available; the flag is honored here only to keep the prop contract uniform
   * and future-proof (e.g., disabling if policy ever changes).
   */
  isReadOnly?: boolean;
}

type Scope = 'all' | 'filtered';

const MODES: {
  mode: ExportMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  {
    mode: 'full',
    label: 'Full Log',
    description: 'Activities plus inline meeting notes',
    icon: FileText,
  },
  {
    mode: 'activities',
    label: 'Activities Only',
    description: 'Official Activities Log, no meeting notes',
    icon: ClipboardList,
  },
  {
    mode: 'meetings',
    label: 'Meetings Only',
    description: 'Scheduled Meetings Log (Date · Competency · Reflection)',
    icon: MessageSquare,
  },
];

function countForMode(logs: InternshipLog[], mode: ExportMode): number {
  if (mode === 'meetings') {
    return logs.filter(hasMeetingNotes).length;
  }
  return logs.length;
}

function slugForMode(mode: ExportMode): string {
  switch (mode) {
    case 'full':
      return 'Full-Log';
    case 'meetings':
      return 'Meetings-Log';
    case 'activities':
    default:
      return 'Activities-Log';
  }
}

function todayStamp(): string {
  return new Date().toISOString().split('T')[0];
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  logs,
  filteredLogs,
  settings,
  authorName,
  isReadOnly = false,
}) => {
  const [mode, setMode] = useState<ExportMode>('full');
  const [scope, setScope] = useState<Scope>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A filtered scope is meaningful only when a distinct, narrower view exists.
  const hasFilteredView = useMemo(
    () =>
      Array.isArray(filteredLogs) &&
      filteredLogs.length !== logs.length,
    [filteredLogs, logs.length]
  );

  const activeLogs = useMemo(
    () => (scope === 'filtered' && filteredLogs ? filteredLogs : logs),
    [scope, filteredLogs, logs]
  );

  // Per-mode entry counts for the currently selected scope.
  const counts = useMemo(
    () => ({
      full: countForMode(activeLogs, 'full'),
      activities: countForMode(activeLogs, 'activities'),
      meetings: countForMode(activeLogs, 'meetings'),
    }),
    [activeLogs]
  );

  const meetingsDisabled = counts.meetings === 0;
  const selectedCount = counts[mode];
  const canExport = selectedCount > 0 && !busy && !isReadOnly;

  // Keep selection valid if meetings becomes disabled under the active scope.
  useEffect(() => {
    if (mode === 'meetings' && meetingsDisabled) {
      setMode('activities');
    }
  }, [mode, meetingsDisabled]);

  const handleExport = async () => {
    if (!canExport) return;
    setBusy(true);
    setError(null);
    try {
      const model = buildExportModel(activeLogs, settings, mode);
      const scopeNote =
        scope === 'filtered' && hasFilteredView ? 'Filtered view' : undefined;
      const blob = await pdf(
        <LogPdf model={model} authorName={authorName} scopeNote={scopeNote} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `InternPro-${slugForMode(mode)}-${todayStamp()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Revoke on the next tick so the download can start.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Something went wrong generating the PDF.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileDown size={20} className="text-app-bright" />
            <h2
              id="export-dialog-title"
              className="text-lg font-semibold text-app-dark"
            >
              Export PDF
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Mode selection */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Document
          </p>
          <div className="space-y-2">
            {MODES.map((m) => {
              const disabled = m.mode === 'meetings' && meetingsDisabled;
              const active = mode === m.mode;
              const Icon = m.icon;
              const count = counts[m.mode];
              return (
                <button
                  key={m.mode}
                  type="button"
                  disabled={disabled}
                  onClick={() => setMode(m.mode)}
                  className={[
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition',
                    active
                      ? 'border-app-bright bg-app-bright/10'
                      : 'border-slate-200 hover:border-slate-300',
                    disabled ? 'cursor-not-allowed opacity-50' : '',
                  ].join(' ')}
                >
                  <Icon
                    size={18}
                    className={active ? 'text-app-bright' : 'text-slate-400'}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-app-dark">
                        {m.label}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {disabled
                          ? 'No meeting notes'
                          : `${count} ${count === 1 ? 'entry' : 'entries'}`}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {m.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scope selection */}
          {hasFilteredView && (
            <>
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scope
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={[
                    'rounded-lg border px-3 py-2 text-sm transition',
                    scope === 'all'
                      ? 'border-app-bright bg-app-bright/10 font-medium text-app-dark'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  All entries ({logs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={[
                    'rounded-lg border px-3 py-2 text-sm transition',
                    scope === 'filtered'
                      ? 'border-app-bright bg-app-bright/10 font-medium text-app-dark'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  Filtered view ({filteredLogs?.length ?? 0})
                </button>
              </div>
            </>
          )}

          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            className="flex items-center gap-2 rounded-lg bg-app-bright px-4 py-2 text-sm font-semibold text-white transition hover:bg-app-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <FileDown size={16} />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
