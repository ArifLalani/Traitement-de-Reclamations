export type Avancement = 'a-traiter' | 'en-cours' | 'en-attente' | 'cloture';
export type Conformite = 'conforme' | 'non-conforme';

export type Complaint = {
  id: string;
  ticket: string;
  requerant: string;
  dateReception: string;
  echeanceLabel: string;
  echeanceWarning?: boolean;
  avancement: Avancement;
  conformite: Conformite;
};

export const AVANCEMENT_LABEL: Record<Avancement, string> = {
  'a-traiter': 'À traiter',
  'en-cours': 'En cours',
  'en-attente': 'En attente',
  cloture: 'Clôturé',
};

export const CONFORMITE_LABEL: Record<Conformite, string> = {
  conforme: 'Conforme',
  'non-conforme': 'Non conforme',
};

export const complaints: Complaint[] = [
  {
    id: '1',
    ticket: '#0057',
    requerant: 'Pierre Fontaine',
    dateReception: '22/04/2026',
    echeanceLabel: '59 jours restants',
    avancement: 'en-cours',
    conformite: 'conforme',
  },
  {
    id: '2',
    ticket: '#0001',
    requerant: 'Martin Lefèvre',
    dateReception: '19/04/2026',
    echeanceLabel: '8 jours restants',
    avancement: 'a-traiter',
    conformite: 'conforme',
  },
  {
    id: '3',
    ticket: '#0003',
    requerant: 'Thomas Bled',
    dateReception: '19/04/2026',
    echeanceLabel: '3 jours restants',
    echeanceWarning: true,
    avancement: 'a-traiter',
    conformite: 'conforme',
  },
  {
    id: '4',
    ticket: '#0024',
    requerant: 'Clair Morin',
    dateReception: '19/04/2026',
    echeanceLabel: '46 jours restants',
    avancement: 'en-cours',
    conformite: 'conforme',
  },
  {
    id: '5',
    ticket: '#0033',
    requerant: 'Martin Lefèvre',
    dateReception: '19/04/2026',
    echeanceLabel: '8 jours restants',
    avancement: 'a-traiter',
    conformite: 'conforme',
  },
  {
    id: '6',
    ticket: '#0012',
    requerant: 'Sophie Arnaud',
    dateReception: '19/04/2026',
    echeanceLabel: '-',
    avancement: 'en-attente',
    conformite: 'conforme',
  },
  {
    id: '7',
    ticket: '#0005',
    requerant: 'Pierre Fontaine',
    dateReception: '19/04/2026',
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
  },
  {
    id: '8',
    ticket: '#0007',
    requerant: 'Pierre Fontaine',
    dateReception: '19/04/2026',
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
  },
];
