import { AVANCEMENT_LABEL, type Complaint } from './complaintsData';

const COLUMNS: { label: string; value: (c: Complaint) => string }[] = [
  { label: 'N° / Référence réclamation', value: (c) => c.ticket },
  { label: 'Nom client / Réclamant', value: (c) => c.requerant },
  { label: 'Dénomination sociale', value: (c) => c.denominateurSocial },
  { label: 'Assureur / Porteur du risque', value: (c) => c.assureur },
  { label: 'objet de la réclamation', value: (c) => c.objet },
  { label: 'Canal de réception', value: (c) => c.canal },
  { label: "Date d'envoi / réception de la réclamation", value: (c) => c.dateReception },
  { label: "Date d'AR / réponse intermédiaire", value: () => '' },
  { label: 'Délai AR ouvrables', value: () => '' },
  { label: 'Respect AR 10 jours ouvrables', value: () => '' },
  { label: 'Interlocuteur en charge', value: () => '' },
  { label: 'Action immédiate - date', value: () => '' },
  { label: 'Action corrective - date', value: () => '' },
  { label: 'Action réalisée', value: () => '' },
  { label: 'Vérification efficacité', value: () => '' },
  { label: 'Date de la réponse / clôture', value: () => '' },
  { label: 'Année de réponse', value: () => '' },
  { label: 'Respect réponse 2 mois', value: () => '' },
  { label: 'Statut', value: (c) => AVANCEMENT_LABEL[c.avancement] },
  { label: 'Réponse apportée', value: () => '' },
  { label: 'Revue annuelle / enseignements', value: () => '' },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cell(value: string, styleId?: string): string {
  const style = styleId ? ` ss:StyleID="${styleId}"` : '';
  return `<Cell${style}><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function row(cells: string[]): string {
  return `<Row>${cells.join('')}</Row>`;
}

export function exportComplaintsToXls(complaints: Complaint[]): void {
  const headerRow = row(COLUMNS.map((col) => cell(col.label, 'Header')));
  const dataRows = complaints
    .map((complaint) => row(COLUMNS.map((col) => cell(col.value(complaint)))))
    .join('');

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#102D69" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Réclamations">
  <Table>
   ${headerRow}
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reclamations-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
