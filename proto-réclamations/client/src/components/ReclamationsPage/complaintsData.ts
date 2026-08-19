import type { Source } from './SourceIcon';
import { reclamations } from './data';

export type Avancement = 'a-traiter' | 'en-cours' | 'en-attente' | 'sans-suite' | 'cloture';
export type Conformite = 'conforme' | 'non-conforme';
export type Relation = 'assure-principal' | 'beneficiaire' | 'mandataire' | 'tiers';
export type Priorite = 'basse' | 'normale' | 'haute';

export type Reclamant = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  relation: Relation | '';
};

export type Classification = {
  porteurDuRisque: string;
  typeSinistre: string;
};

export type Traitement = {
  statut: string;
  interlocuteur: string;
  priorite: Priorite | '';
};

export type HistoriqueEntry = {
  title: string;
  description: string;
  date: string;
  author: string;
};

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
  sourceUrl?: string;
  denominateurSocial: string;
  assureur: string;
  email: string;
  objet: string;
  description: string;
  reclamant: Reclamant;
  classification: Classification;
  traitement: Traitement;
  notesInternes: string;
  historique: HistoriqueEntry[];
};

export const AVANCEMENT_LABEL: Record<Avancement, string> = {
  'a-traiter': 'À traiter',
  'en-cours': 'En cours',
  'en-attente': 'En attente',
  'sans-suite': 'Sans suite',
  cloture: 'Clôturé',
};

export const CONFORMITE_LABEL: Record<Conformite, string> = {
  conforme: 'Conforme',
  'non-conforme': 'Non conforme',
};

export const RELATION_LABEL: Record<Relation, string> = {
  'assure-principal': 'Assuré principal',
  beneficiaire: 'Bénéficiaire',
  mandataire: 'Mandataire',
  tiers: 'Tiers',
};

export const PRIORITE_LABEL: Record<Priorite, string> = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
};

type DossierStepStatus = 'done' | 'current' | 'upcoming';

export type DossierStep = {
  label: string;
  status: DossierStepStatus;
  badgeLabel?: string;
  badgeWarning?: boolean;
};

// Where a complaint's file currently sits in its 5-stage lifecycle. Steps 0-1
// (mention received, complaint created) are implicit — a Complaint record
// existing at all means both already happened.
export function getDossierSteps(complaint: Pick<Complaint, 'avancement' | 'echeanceLabel' | 'echeanceWarning'>): DossierStep[] {
  const { avancement, echeanceLabel, echeanceWarning } = complaint;
  const arDone = avancement !== 'a-traiter';
  const reponseDone = avancement === 'sans-suite' || avancement === 'cloture';
  const clotureDone = avancement === 'cloture';

  return [
    { label: 'Réception de la mention', status: 'done', badgeLabel: 'Complété' },
    { label: 'Création de la réclamation', status: 'done', badgeLabel: 'Complété' },
    {
      label: "Confirmation de l'envoi de l'Accusé de Réception",
      status: arDone ? 'done' : 'current',
      badgeLabel: arDone ? 'Complété' : echeanceLabel,
      badgeWarning: !arDone && echeanceWarning,
    },
    {
      label: 'Confirmation de l’envoi de la Réponse Définitive',
      status: reponseDone ? 'done' : arDone ? 'current' : 'upcoming',
      badgeLabel: reponseDone ? 'Complété' : arDone ? echeanceLabel : undefined,
      badgeWarning: arDone && !reponseDone && echeanceWarning,
    },
    {
      label: 'Clôture du dossier de réclamation',
      status: clotureDone ? 'done' : reponseDone ? 'current' : 'upcoming',
      badgeLabel: clotureDone ? 'Complété' : undefined,
    },
  ];
}

function splitName(fullName: string): [string, string] {
  const cleaned = fullName.replace(/^@/, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return [parts[0] ?? '', ''];
  return [parts[0], parts.slice(1).join(' ')];
}

export const TYPES_SINISTRE = [
  'Sinistre auto',
  'Sinistre habitation',
  'Sinistre santé',
  'Sinistre responsabilité civile',
  'Litige contractuel',
];

export const INTERLOCUTEURS = ['Julien Fontaine', 'Claire Martin', 'Marc Dubois', 'Sophie Leroy'];

type ComplaintCore = Omit<Complaint, 'reclamant' | 'classification' | 'traitement' | 'notesInternes' | 'historique'>;

function attachDetails(c: ComplaintCore): Complaint {
  const [prenom, nom] = splitName(c.requerant);
  const porteurDuRisque = c.assureur && c.assureur !== 'Non renseigné' ? c.assureur : '';

  const historique: HistoriqueEntry[] = [
    {
      title: 'Création de la réclamation',
      description: `Créée depuis une mention ${c.canal} — « ${c.objet} »`,
      date: c.dateReception,
      author: 'Système',
    },
  ];
  if (c.avancement !== 'a-traiter') {
    historique.push({
      title: "Confirmation de l'envoi de l'Accusé de Réception",
      description: 'Accusé de réception envoyé au réclamant.',
      date: c.dateReception,
      author: 'Julien Fontaine',
    });
  }
  if (c.avancement === 'sans-suite' || c.avancement === 'cloture') {
    historique.push({
      title: 'Confirmation de l’envoi de la Réponse Définitive',
      description: 'Réponse définitive envoyée au réclamant.',
      date: c.dateReception,
      author: 'Julien Fontaine',
    });
  }

  return {
    ...c,
    reclamant: {
      prenom,
      nom,
      email: c.email,
      telephone: '',
      relation: '',
    },
    classification: {
      porteurDuRisque,
      typeSinistre: '',
    },
    traitement: {
      statut: AVANCEMENT_LABEL[c.avancement],
      interlocuteur: '',
      priorite: '',
    },
    notesInternes: '',
    historique,
  };
}

const OBJET_KEYWORDS: [RegExp, string][] = [
  [/remboursement/i, 'Retard de remboursement'],
  [/résiliat/i, 'Demande de résiliation de contrat'],
  [/sinistre/i, 'Suivi de dossier sinistre'],
  [/facturation|facture/i, 'Erreur de facturation'],
  [/délai/i, 'Délai de traitement excessif'],
  [/devis/i, 'Litige sur un devis'],
  [/réponse|répond|contact|appel/i, 'Absence de réponse du service client'],
];

function suggestObjet(text: string): string {
  const match = OBJET_KEYWORDS.find(([regex]) => regex.test(text));
  if (match) return match[1];
  const firstSentence = text.split(/[.!?]/)[0].trim();
  return firstSentence.length > 60 ? `${firstSentence.slice(0, 60)}…` : firstSentence;
}

const DIACRITICS_REGEX = /[̀-ͯ]/g;

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS_REGEX, '');
}

function guessEmail(author: string): string {
  const cleaned = author.replace(/^@/, '');
  if (/^[a-zà-ÿ]+\s[a-zà-ÿ]+$/i.test(author)) {
    const [first, last] = author.toLowerCase().split(/\s+/);
    return stripDiacritics(`${first}.${last}@gmail.com`);
  }
  if (/^[a-z0-9._]+$/i.test(cleaned)) {
    return `${cleaned.toLowerCase()}@gmail.com`;
  }
  return '';
}

function formatDateReception(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString('fr-FR');
}

const TICKET_NUMBERS = [57, 1, 3, 24, 33, 12, 5, 7, 19, 41, 2, 9, 28, 15];
const AVANCEMENT_CYCLE: Avancement[] = [
  'en-cours',
  'a-traiter',
  'a-traiter',
  'sans-suite',
  'a-traiter',
  'en-attente',
  'cloture',
  'cloture',
  'en-cours',
  'a-traiter',
  'en-attente',
  'cloture',
  'a-traiter',
  'en-cours',
];
const REMAINING_DAYS = [59, 8, 3, 46, 8, 12, 0, 0, 27, 6, 15, 0, 2, 34];

// A handful of longer descriptions so the drawer's "Voir plus" can actually
// be exercised — most mention texts are short and fit within 4 lines.
const LONG_DESCRIPTIONS: Record<number, string> = {
  0: "Le client conteste le refus de remboursement suite à un sinistre survenu le 12 mars 2024. Il joint un constat amiable et demande un réexamen complet de son dossier. Il souligne également l'importance de ce remboursement pour couvrir les frais déjà engagés auprès du garagiste, et précise qu'il a transmis l'ensemble des pièces justificatives demandées dès la première relance. De plus, il espère une réponse rapide afin de résoudre cette situation au plus vite, faute de quoi il envisagera de saisir le médiateur des assurances.",
  2: "Sinistre déclaré il y a un mois, toujours aucune indemnisation reçue à ce jour. Le suivi en ligne n'est jamais mis à jour, ce qui oblige le client à appeler le service client à chaque fois pour obtenir une information, souvent contradictoire selon l'interlocuteur. Il demande qu'un point précis et écrit lui soit communiqué sur l'état réel de son dossier, ainsi qu'un engagement clair sur un délai de traitement, car la situation lui cause un préjudice financier non négligeable depuis plusieurs semaines.",
  5: "Le remboursement reçu ne correspond pas du tout au montant indiqué dans le devis qui avait pourtant été validé initialement par l'assureur. Le client a recontacté plusieurs fois le service client sans obtenir d'explication satisfaisante sur l'écart constaté, et demande qu'une vérification approfondie soit menée sur le calcul de l'indemnisation. Il souhaite également savoir si un complément de versement est prévu et dans quel délai, faute de quoi il se réserve le droit de contester formellement la décision.",
  9: "Dossier transmis depuis plus de trois semaines pour un dégât des eaux important, toujours en attente du passage de l'expert malgré plusieurs relances par téléphone et par email restées sans réponse claire. Le délai annoncé initialement par l'agence n'a clairement pas été respecté, et les dégâts continuent de s'aggraver en l'absence d'intervention. Le client demande qu'un expert soit dépêché en urgence et qu'un geste commercial soit envisagé pour compenser ce retard significatif.",
};

const archivedComplaintsCore: ComplaintCore[] = [
  {
    id: 'archived-001',
    ticket: '#0044',
    requerant: 'Isabelle Renaud',
    dateReception: formatDateReception(95),
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'isabelle.renaud@gmail.com',
    objet: 'Remboursement sinistre automobile',
    description:
      "Réclamation relative au délai de remboursement suite à un sinistre automobile. Dossier traité et clôturé après versement de l'indemnisation le 14 janvier 2026.",
  },
  {
    id: 'archived-002',
    ticket: '#0038',
    requerant: 'Lucas Bernard',
    dateReception: formatDateReception(110),
    echeanceLabel: '-',
    avancement: 'sans-suite',
    conformite: 'conforme',
    canal: 'Web',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'lucas.bernard@gmail.com',
    objet: 'Contestation de résiliation de contrat',
    description:
      "Le client contestait la résiliation de son contrat habitation. Après examen du dossier, la résiliation a été confirmée conforme aux conditions générales. Classé sans suite après accord du client.",
  },
  {
    id: 'archived-003',
    ticket: '#0031',
    requerant: 'Nathalie Vasseur',
    dateReception: formatDateReception(130),
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'non-conforme',
    canal: 'Facebook',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'nathalie.vasseur@gmail.com',
    objet: 'Erreur de facturation sur prime annuelle',
    description:
      "Double prélèvement constaté sur le compte de la cliente. Erreur de facturation confirmée et remboursement effectué sous 5 jours ouvrés. Dossier clôturé avec geste commercial.",
  },
  {
    id: 'archived-004',
    ticket: '#0026',
    requerant: 'Arnaud Petit',
    dateReception: formatDateReception(148),
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'arnaud.petit@gmail.com',
    objet: 'Délai de traitement excessif — dossier sinistre',
    description:
      "Réclamation portant sur un délai de traitement jugé trop long pour un sinistre dégât des eaux. Dossier finalisé après intervention de l'expert et versement de l'indemnisation.",
  },
  {
    id: 'archived-005',
    ticket: '#0018',
    requerant: 'Céline Morel',
    dateReception: formatDateReception(162),
    echeanceLabel: '-',
    avancement: 'sans-suite',
    conformite: 'conforme',
    canal: 'X',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'celine.morel@gmail.com',
    objet: 'Absence de réponse du service client',
    description:
      "La cliente signalait une absence de réponse à ses sollicitations. Après contact, il s'est avéré que les emails étaient redirigés dans les spams. Classé sans suite après résolution.",
  },
  {
    id: 'archived-006',
    ticket: '#0014',
    requerant: 'Julien Garnier',
    dateReception: formatDateReception(178),
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'julien.garnier@gmail.com',
    objet: 'Litige sur un devis de réparation',
    description:
      "Le client contestait un écart entre le devis initial et la facture finale pour une réparation de toiture. Après médiation avec le prestataire, un avoir a été accordé et le dossier clôturé.",
  },
  {
    id: 'archived-007',
    ticket: '#0011',
    requerant: 'Marie-Claire Dupuis',
    dateReception: formatDateReception(195),
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Web',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'mariec.dupuis@gmail.com',
    objet: 'Retard de remboursement frais médicaux',
    description:
      "Réclamation portant sur un remboursement de frais médicaux tardif. Le virement a été effectué dans les délais réglementaires après correction d'une erreur de RIB. Dossier clôturé.",
  },
  {
    id: 'archived-008',
    ticket: '#0008',
    requerant: 'Thierry Blanchard',
    dateReception: formatDateReception(210),
    echeanceLabel: '-',
    avancement: 'sans-suite',
    conformite: 'non-conforme',
    canal: 'Facebook',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'thierry.blanchard@gmail.com',
    objet: 'Demande de résiliation de contrat',
    description:
      "Le client souhaitait résilier son contrat avec effet immédiat hors délai légal. Après examen, la demande n'entrait pas dans les cas de résiliation anticipée. Classé sans suite.",
  },
  {
    id: 'archived-009',
    ticket: '#0006',
    requerant: 'Sophie Aubert',
    dateReception: formatDateReception(225),
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Instagram',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'sophie.aubert@gmail.com',
    objet: 'Suivi de dossier sinistre vol',
    description:
      "La cliente n'avait pas reçu de nouvelles de son dossier sinistre vol après 6 semaines. Après relance interne, l'expertise a été diligentée et l'indemnisation versée. Dossier clôturé.",
  },
  {
    id: 'archived-010',
    ticket: '#0004',
    requerant: 'François Lemaire',
    dateReception: formatDateReception(240),
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'francois.lemaire@gmail.com',
    objet: 'Erreur de facturation — doublon de cotisation',
    description:
      "Double prélèvement de la cotisation annuelle constaté en janvier. Remboursement effectué sous 48h après vérification comptable. Le client a confirmé la réception du virement.",
  },
  {
    id: 'archived-011',
    ticket: '#0010',
    requerant: 'Élise Fontaine',
    dateReception: formatDateReception(258),
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'LinkedIn',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'elise.fontaine@gmail.com',
    objet: 'Délai de traitement excessif — expertise',
    description:
      "Attente de plus de deux mois pour le passage de l'expert suite à un dégât des eaux. Dossier escaladé, expert mandaté en urgence. Indemnisation versée et clôture formalisée.",
  },
  {
    id: 'archived-012',
    ticket: '#0016',
    requerant: 'Marc Girard',
    dateReception: formatDateReception(275),
    echeanceLabel: '-',
    avancement: 'sans-suite',
    conformite: 'conforme',
    canal: 'Web',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'marc.girard@gmail.com',
    objet: "Contestation clause d'exclusion",
    description:
      "Le client contestait l'application d'une clause d'exclusion de garantie suite à un sinistre. Après analyse juridique, la clause a été jugée applicable. Classé sans suite.",
  },
  {
    id: 'archived-013',
    ticket: '#0020',
    requerant: 'Patricia Chevalier',
    dateReception: formatDateReception(290),
    echeanceLabel: '-',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: 'Non renseigné',
    assureur: 'Non renseigné',
    email: 'patricia.chevalier@gmail.com',
    objet: 'Absence de réponse — renouvellement contrat',
    description:
      "La cliente n'avait pas reçu ses documents de renouvellement malgré plusieurs relances. Erreur d'adresse email dans notre système. Corrigé et documents renvoyés. Dossier clôturé.",
  },
];

export const archivedComplaints: Complaint[] = archivedComplaintsCore.map(attachDetails);

const complaintsCore: ComplaintCore[] = reclamations
  .filter((r) => r.state === 'mes-reclamations')
  .map((r, index) => {
    const avancement = AVANCEMENT_CYCLE[index % AVANCEMENT_CYCLE.length];
    const remainingDays = REMAINING_DAYS[index % REMAINING_DAYS.length];
    const isClosed = avancement === 'cloture' || avancement === 'sans-suite';
    const description = LONG_DESCRIPTIONS[index] ?? r.text;

    return {
      id: `complaint-${r.id}`,
      sourceReclamationId: r.id,
      ticket: `#${String(TICKET_NUMBERS[index % TICKET_NUMBERS.length]).padStart(4, '0')}`,
      requerant: r.author,
      dateReception: formatDateReception(index * 4 + 3),
      echeanceLabel: isClosed ? '-' : `${remainingDays} jours restants`,
      echeanceWarning: !isClosed && remainingDays <= 3,
      avancement,
      conformite: index === 9 ? 'non-conforme' : 'conforme',
      canal: r.source,
      sourceUrl: r.url,
      denominateurSocial: 'Non renseigné',
      assureur: 'Non renseigné',
      email: guessEmail(r.author),
      objet: suggestObjet(description),
      description,
    };
  });

export const complaints: Complaint[] = complaintsCore.map(attachDetails);
