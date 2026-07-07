import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';
import type {
  ExportModel,
  ExportColumn,
  ExportRow,
} from '../../lib/export-model';

/**
 * LogPdf — renders an ExportModel (from lib/export-model) to a submission-grade
 * PDF using @react-pdf/renderer. Restrained, Bethel-appropriate styling:
 * repeated table headers on every page, page numbers, an official column layout,
 * and a totals section. Meetings mode uses Date · Competency · Reflection.
 *
 * This component is pure presentation over the model — it computes no domain
 * numbers of its own; buildExportModel is the single source of truth.
 */

export interface LogPdfProps {
  /** The renderer-agnostic model produced by buildExportModel. */
  model: ExportModel;
  /** Portfolio owner's name, printed under the title. */
  authorName?: string | null;
  /** ISO or display date the export was generated (defaults to today). */
  generatedOn?: string;
  /**
   * Optional scope note (e.g., "Filtered view: High School · April") printed in
   * the header when the export reflects the current filtered view.
   */
  scopeNote?: string;
}

// Bethel-restrained palette (mirrors the app's app-* colors in index.html).
const INK = '#142930'; // app-dark
const DEEP = '#305663'; // app-deep
const RULE = '#c9d4d8';
const RULE_LIGHT = '#e6ecee';
const ZEBRA = '#f4f7f8';
const MUTED = '#54727c';

// Relative column widths (flex weights) per column key.
const COL_FLEX: Record<string, number> = {
  date: 1.1,
  activity: 3.4,
  competency: 1.6,
  location: 1.6,
  hours: 0.8,
  level: 1.3,
  reflection: 4.0,
};

// Columns whose numeric content is right-aligned.
const NUMERIC_KEYS = new Set(['hours']);

const flexFor = (key: string): number => COL_FLEX[key] ?? 1.5;

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 52,
    paddingHorizontal: 36,
    fontSize: 9,
    color: INK,
    fontFamily: 'Helvetica',
    lineHeight: 1.35,
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: DEEP,
    paddingBottom: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: INK,
  },
  subline: {
    marginTop: 3,
    fontSize: 9,
    color: MUTED,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: DEEP,
    color: '#ffffff',
  },
  headerCell: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.75,
    borderBottomColor: RULE_LIGHT,
  },
  rowZebra: {
    backgroundColor: ZEBRA,
  },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8.5,
  },
  cellRight: {
    textAlign: 'right',
  },
  meetingNotes: {
    flexDirection: 'row',
    borderBottomWidth: 0.75,
    borderBottomColor: RULE_LIGHT,
    backgroundColor: '#eef3f4',
  },
  meetingNotesInner: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    flex: 1,
  },
  meetingNotesLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: DEEP,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meetingNotesText: {
    fontSize: 8.5,
    color: INK,
    marginTop: 1,
  },
  totals: {
    marginTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: DEEP,
    paddingTop: 8,
  },
  totalsTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    color: INK,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    maxWidth: 260,
  },
  totalsLabel: {
    fontSize: 9,
    color: DEEP,
  },
  totalsValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: INK,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    marginTop: 2,
    borderTopWidth: 0.75,
    borderTopColor: RULE,
    maxWidth: 260,
  },
  empty: {
    marginTop: 24,
    fontSize: 10,
    color: MUTED,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 0.5,
    borderTopColor: RULE_LIGHT,
    paddingTop: 6,
  },
});

const BUCKET_LABELS: Record<string, string> = {
  HighSchool: 'High School',
  Elementary: 'Elementary',
  Middle: 'Middle',
};

function formatToday(): string {
  return new Date().toISOString().split('T')[0];
}

const TableHeader: React.FC<{ columns: ExportColumn[] }> = ({ columns }) => (
  // `fixed` makes react-pdf repeat this header at the top of every page.
  <View style={styles.tableHeaderRow} fixed>
    {columns.map((col) => (
      <Text
        key={col.key}
        style={[
          styles.headerCell,
          { flex: flexFor(col.key) },
          NUMERIC_KEYS.has(col.key) ? styles.cellRight : {},
        ]}
      >
        {col.label}
      </Text>
    ))}
  </View>
);

const TableRow: React.FC<{
  columns: ExportColumn[];
  row: ExportRow;
  index: number;
}> = ({ columns, row, index }) => (
  <View wrap={false}>
    <View style={[styles.row, index % 2 === 1 ? styles.rowZebra : {}]}>
      {columns.map((col) => (
        <Text
          key={col.key}
          style={[
            styles.cell,
            { flex: flexFor(col.key) },
            NUMERIC_KEYS.has(col.key) ? styles.cellRight : {},
          ]}
        >
          {row.cells[col.key] ?? ''}
        </Text>
      ))}
    </View>
    {row.meetingNotes ? (
      <View style={styles.meetingNotes}>
        <View style={styles.meetingNotesInner}>
          <Text style={styles.meetingNotesLabel}>
            Meeting Notes
            {row.meetingNotes.competencyIds.length > 0
              ? ` · ${row.meetingNotes.competencyIds.join(', ')}`
              : ''}
          </Text>
          <Text style={styles.meetingNotesText}>
            {row.meetingNotes.reflection}
          </Text>
        </View>
      </View>
    ) : null}
  </View>
);

const Totals: React.FC<{ model: ExportModel }> = ({ model }) => {
  if (!model.totals) return null;
  const { byBucket, grandTotal } = model.totals;
  const bucketKeys = Object.keys(byBucket);
  return (
    <View style={styles.totals} wrap={false} break>
      <Text style={styles.totalsTitle}>Hours by Level</Text>
      {bucketKeys.map((key) => (
        <View key={key} style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>
            {BUCKET_LABELS[key] ?? key}
          </Text>
          <Text style={styles.totalsValue}>
            {byBucket[key as keyof typeof byBucket].toFixed(2)}
          </Text>
        </View>
      ))}
      <View style={styles.grandTotalRow}>
        <Text style={styles.totalsValue}>Grand Total</Text>
        <Text style={styles.totalsValue}>{grandTotal.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const LogPdf: React.FC<LogPdfProps> = ({
  model,
  authorName,
  generatedOn,
  scopeNote,
}) => {
  const columns = model.columns;
  const rows = model.rows;
  const generated = generatedOn ?? formatToday();

  return (
    <Document title={model.title} author={authorName ?? undefined}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.title}>{model.title}</Text>
          <Text style={styles.subline}>
            {authorName ? `${authorName} · ` : ''}
            Generated {generated}
            {scopeNote ? ` · ${scopeNote}` : ''}
          </Text>
        </View>

        {rows.length === 0 ? (
          <Text style={styles.empty}>No entries to export.</Text>
        ) : (
          <View>
            <TableHeader columns={columns} />
            {rows.map((row, i) => (
              <TableRow
                key={row.entryId}
                columns={columns}
                row={row}
                index={i}
              />
            ))}
          </View>
        )}

        <Totals model={model} />

        <View style={styles.footer} fixed>
          <Text>InternPro · {model.title}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default LogPdf;
