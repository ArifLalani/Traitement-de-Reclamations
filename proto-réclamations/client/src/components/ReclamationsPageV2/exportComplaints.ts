import * as XLSX from 'xlsx-js-style';
import { AVANCEMENT_LABEL, type Complaint } from './complaintsData';
import type { ExportPeriod } from './ExportMenu';

type Column = { label: string; width: number; value: (c: Complaint) => string };

const COLUMNS: Column[] = [
  { label: 'N° / Référence réclamation', width: 22, value: (c) => c.ticket },
  { label: 'Nom client / Réclamant', width: 24, value: (c) => c.requerant },
  { label: 'Dénomination sociale', width: 22, value: (c) => c.denominateurSocial },
  { label: 'Assureur / Porteur du risque', width: 26, value: (c) => c.assureur },
  { label: 'Objet de la réclamation', width: 36, value: (c) => c.objet },
  { label: 'Canal de réception', width: 18, value: (c) => c.canal },
  { label: "Date d'envoi / réception de la réclamation", width: 20, value: (c) => c.dateReception },
  { label: "Date d'AR / réponse intermédiaire", width: 20, value: () => '' },
  { label: 'Délai AR 10 jours ouvrables', width: 16, value: () => '' },
  { label: 'Respect AR 10 jours ouvrables', width: 18, value: () => '' },
  { label: 'Interlocuteur en charge', width: 22, value: () => '' },
  { label: 'Action immédiate - date', width: 20, value: () => '' },
  { label: 'Action corrective - date', width: 20, value: () => '' },
  { label: 'Actions engagées', width: 16, value: () => '' },
  { label: "Vérification d'efficacité", width: 20, value: () => '' },
  { label: 'Date de la réponse / clôture', width: 20, value: () => '' },
  { label: 'Année de réponse', width: 14, value: () => '' },
  { label: 'Respect réponse 2 mois', width: 18, value: () => '' },
  { label: 'Statut', width: 14, value: (c) => AVANCEMENT_LABEL[c.avancement] },
  { label: 'Réponses apportées', width: 30, value: () => '' },
  { label: 'Revue annuelle / enseignements', width: 30, value: () => '' },
];

const HEADER_STYLE = {
  fill: { fgColor: { rgb: '102D69' }, patternType: 'solid' },
  font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Calibri', sz: 11 },
  alignment: { vertical: 'center', wrapText: false },
  border: {
    top: { style: 'thin', color: { rgb: '7A9CC8' } },
    bottom: { style: 'thin', color: { rgb: '7A9CC8' } },
    left: { style: 'thin', color: { rgb: '7A9CC8' } },
    right: { style: 'thin', color: { rgb: '7A9CC8' } },
  },
};

const DATA_STYLE_ODD = {
  font: { name: 'Calibri', sz: 11 },
  alignment: { vertical: 'center', wrapText: false },
  border: {
    top: { style: 'thin', color: { rgb: 'C5CEE6' } },
    bottom: { style: 'thin', color: { rgb: 'C5CEE6' } },
    left: { style: 'thin', color: { rgb: 'C5CEE6' } },
    right: { style: 'thin', color: { rgb: 'C5CEE6' } },
  },
};

const DATA_STYLE_EVEN = {
  fill: { fgColor: { rgb: 'D9E1F2' }, patternType: 'solid' },
  font: { name: 'Calibri', sz: 11 },
  alignment: { vertical: 'center', wrapText: false },
  border: {
    top: { style: 'thin', color: { rgb: 'B0BCE0' } },
    bottom: { style: 'thin', color: { rgb: 'B0BCE0' } },
    left: { style: 'thin', color: { rgb: 'B0BCE0' } },
    right: { style: 'thin', color: { rgb: 'B0BCE0' } },
  },
};

function normalizeValue(value: string): string {
  return value.trim().toLowerCase() === 'non renseigné' ? '-' : value;
}

const MONTH_NAMES_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

function monthIndexFromName(name: string): number {
  const normalized = name.toLowerCase();
  const index = MONTH_NAMES_FR.indexOf(normalized);
  // "aout"/"août" both map to month 7 — the list above has both spellings
  // adjacent, "août" duplicating index 7, so anything from index 8 onward
  // needs to be shifted back by one.
  if (index === -1) return -1;
  return index >= 8 ? index - 1 : index;
}

function parseDateReception(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

function parseRangeBound(value: string, period: ExportPeriod, isEnd: boolean): Date | null {
  const trimmed = value.trim();
  if (period === 'custom') {
    const date = parseDateReception(trimmed);
    if (!date) return null;
    if (isEnd) date.setHours(23, 59, 59, 999);
    return date;
  }
  if (period === 'mois') {
    const match = trimmed.match(/^([a-zà-ÿ]+)\s+(\d{4})$/i);
    if (!match) return null;
    const monthIndex = monthIndexFromName(match[1]);
    if (monthIndex === -1) return null;
    const year = Number(match[2]);
    return isEnd ? new Date(year, monthIndex + 1, 0, 23, 59, 59, 999) : new Date(year, monthIndex, 1);
  }
  // 'annees'
  const year = Number(trimmed);
  if (!year) return null;
  return isEnd ? new Date(year, 11, 31, 23, 59, 59, 999) : new Date(year, 0, 1);
}

export function filterComplaintsByRange(
  complaints: Complaint[],
  range: { period: ExportPeriod; from: string; to: string },
): Complaint[] {
  const from = parseRangeBound(range.from, range.period, false);
  const to = parseRangeBound(range.to, range.period, true);
  if (!from && !to) return complaints;

  return complaints.filter((c) => {
    const date = parseDateReception(c.dateReception);
    // Don't silently drop a record just because its date couldn't be parsed.
    if (!date) return true;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
}

export function exportComplaintsToXls(complaints: Complaint[]): void {
  const wb = XLSX.utils.book_new();

  const sorted = [...complaints].sort(
    (a, b) => Number(a.ticket.replace('#', '')) - Number(b.ticket.replace('#', '')),
  );

  // Build rows: header + data
  const headerRow = COLUMNS.map((col) => col.label);
  const dataRows = sorted.map((c) => COLUMNS.map((col) => normalizeValue(col.value(c))));
  const aoa = [headerRow, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  ws['!cols'] = COLUMNS.map((col) => ({ wch: col.width }));

  // Apply header styles (row 0 → Excel row 1)
  COLUMNS.forEach((_, colIdx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
    if (ws[cellRef]) ws[cellRef].s = HEADER_STYLE;
  });

  // Apply data styles (alternating rows)
  sorted.forEach((_, rowIdx) => {
    const style = rowIdx % 2 === 0 ? DATA_STYLE_ODD : DATA_STYLE_EVEN;
    COLUMNS.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      if (ws[cellRef]) ws[cellRef].s = style;
    });
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Réclamations');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reclamations-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toCsvCell(value: string): string {
  return /[",;\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function exportComplaintsToCsv(complaints: Complaint[]): void {
  const sorted = [...complaints].sort(
    (a, b) => Number(a.ticket.replace('#', '')) - Number(b.ticket.replace('#', '')),
  );

  const headerRow = COLUMNS.map((col) => col.label);
  const dataRows = sorted.map((c) => COLUMNS.map((col) => normalizeValue(col.value(c))));
  const csv = [headerRow, ...dataRows].map((row) => row.map(toCsvCell).join(';')).join('\r\n');

  // Prefix with a BOM so Excel opens accented characters correctly.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reclamations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
