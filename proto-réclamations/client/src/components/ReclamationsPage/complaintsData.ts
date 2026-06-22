import type { Source } from './SourceIcon';

export type Avancement = 'a-traiter' | 'en-cours' | 'en-attente' | 'cloture';
export type Conformite = 'conforme' | 'non-conforme';

export type Complaint = {
  id: string;
  sourceReclamationId?: string;
  ticket: string;
  requerant: string;
  dateReception: string;
  echeanceLabel: string;
  echeanceWarning?: boolean;
  avancement: Avancement;
  conformite: Conformite;
  canal: Source;
  denominateurSocial: string;
  assureur: string;
  email: string;
  objet: string;
  description: string;
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
    canal: 'Facebook',
    denominateurSocial: 'Inconnu',
    assureur: 'Inconnu',
    email: 'pierre.fontaine@gmail.com',
    objet: 'Contestation de refus de remboursement',
    description:
      "Le client conteste le refus de remboursement suite à un sinistre survenu le 12 mars 2024. Il joint un constat amiable et demande un réexamen. Il souligne également l'importance de ce remboursement pour couvrir les frais engagés. De plus, il espère une réponse rapide afin de résoudre cette situation au plus vite.",
  },
  {
    id: '2',
    ticket: '#0001',
    requerant: 'Martin Lefèvre',
    dateReception: '19/04/2026',
    echeanceLabel: '8 jours restants',
    avancement: 'a-traiter',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: 'Inconnu',
    assureur: 'Inconnu',
    email: 'martin.lefevre@outlook.com',
    objet: 'Délai de traitement excessif',
    description:
      "Le client signale qu'aucun retour n'a été apporté à son dossier depuis plusieurs semaines malgré plusieurs relances téléphoniques. Il demande un point de situation précis et une estimation du délai restant avant clôture.",
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
    canal: 'X',
    denominateurSocial: 'Inconnu',
    assureur: 'Inconnu',
    email: 'thomas.bled@yahoo.fr',
    objet: 'Facturation incorrecte',
    description:
      "Le client a constaté un prélèvement supérieur au montant prévu dans son contrat. Il demande une vérification de sa facturation des trois derniers mois et un remboursement du différentiel constaté.",
  },
  {
    id: '4',
    ticket: '#0024',
    requerant: 'Clair Morin',
    dateReception: '19/04/2026',
    echeanceLabel: '46 jours restants',
    avancement: 'en-cours',
    conformite: 'conforme',
    canal: 'Trustpilot',
    denominateurSocial: 'Inconnu',
    assureur: 'Inconnu',
    email: 'clair.morin@gmail.com',
    objet: 'Suivi de dossier sinistre',
    description:
      "Le client souhaite obtenir un état d'avancement détaillé de son dossier sinistre, ouvert depuis plus d'un mois, ainsi qu'une estimation du montant d'indemnisation à venir.",
  },
  {
    id: '5',
    ticket: '#0033',
    requerant: 'Martin Lefèvre',
    dateReception: '19/04/2026',
    echeanceLabel: '8 jours restants',
    avancement: 'a-traiter',
    conformite: 'conforme',
    canal: 'Instagram',
    denominateurSocial: 'Inconnu',
    assureur: 'Inconnu',
    email: 'martin.lefevre@outlook.com',
    objet: 'Litige sur un devis',
    description:
      "Le client estime que le devis transmis ne correspond pas aux garanties initialement souscrites et demande une révision complète avant d'accepter la prise en charge proposée.",
  },
  {
    id: '6',
    ticket: '#0012',
    requerant: 'Sophie Arnaud',
    dateReception: '19/04/2026',
    echeanceLabel: '-',
    avancement: 'en-attente',
    conformite: 'conforme',
    canal: 'LinkedIn',
    denominateurSocial: 'Inconnu',
    assureur: 'Inconnu',
    email: 'sophie.arnaud@gmail.com',
    objet: 'Résiliation de contrat',
    description:
      "La cliente demande la résiliation immédiate de son contrat suite à plusieurs incidents non résolus et souhaite être informée des modalités de remboursement des cotisations restantes.",
  },
  {
    id: '7',
    ticket: '#0005',
    requerant: 'Pierre Fontaine',
    dateReception: '19/04/2026',
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Web',
    denominateurSocial: 'Inconnu',
    assureur: 'Inconnu',
    email: 'pierre.fontaine@gmail.com',
    objet: 'Absence de réponse du service client',
    description:
      "Le client avait signalé plusieurs tentatives de contact infructueuses. Le dossier a depuis été traité et une réponse définitive a été transmise au client.",
  },
  {
    id: '8',
    ticket: '#0007',
    requerant: 'Pierre Fontaine',
    dateReception: '19/04/2026',
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Facebook',
    denominateurSocial: 'Inconnu',
    assureur: 'Inconnu',
    email: 'pierre.fontaine@gmail.com',
    objet: 'Erreur de facturation',
    description:
      "Une erreur de facturation avait été identifiée et corrigée. Le remboursement du trop-perçu a été effectué et confirmé au client par email.",
  },
];
