import * as XLSX from 'xlsx-js-style';
import { AVANCEMENT_LABEL, type Complaint } from './complaintsData';

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
  { label: 'Action réalisée', width: 16, value: () => '' },
  { label: 'Vérification efficacité', width: 20, value: () => '' },
  { label: 'Date de la réponse / clôture', width: 20, value: () => '' },
  { label: 'Année de réponse', width: 14, value: () => '' },
  { label: 'Respect réponse 2 mois', width: 18, value: () => '' },
  { label: 'Statut', width: 14, value: (c) => AVANCEMENT_LABEL[c.avancement] },
  { label: 'Réponse apportée', width: 30, value: () => '' },
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
