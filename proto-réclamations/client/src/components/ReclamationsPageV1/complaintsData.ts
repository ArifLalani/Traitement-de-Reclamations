import type { Source } from './SourceIcon';
import { reclamations } from './data';

export type Avancement = 'a-traiter' | 'sans-suite' | 'cloture';
export type Conformite = 'conforme' | 'non-conforme';
export type StatutClient =
  | 'souscripteur'
  | 'assure'
  | 'utilisateur'
  | 'beneficiaire'
  | 'representant'
  | 'tiers';
export type Priorite = 'basse' | 'normale' | 'haute';

export type Reclamant = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  // Whether the réclamant is attached to a contract — gates the statut
  // field below, which only makes sense once "oui".
  rattacheContrat: 'oui' | 'non' | '';
  statutClient: StatutClient | '';
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

export type SuiviCloture = {
  dateAR: string;
  dateReponse: string;
  // Set when the "Confirmer la demande" fallback is used instead of the AR
  // (réclamant contact info missing) — puts the dossier in the "En attente"
  // sub-state until that info is filled in or the dossier is closed.
  demandeContactDate: string;
  actionImmediate: string;
  actionCorrective: string;
  actionRealisee: string;
  actionsCorrectives: string;
  verificationEfficacite: string;
};

export type HistoriqueEntry = {
  title: string;
  description: string;
  date: string;
  author: string;
  // The individual field → new value pairs behind a "Modification de ..."
  // entry, when known — lets the history show what was actually chosen
  // instead of just which fields changed. Any input type works here since
  // it's just a label + its stringified value.
  changes?: { label: string; value: string }[];
};

export type Complaint = {
  id: string;
  sourceReclamationId?: string;
  ticket: string;
  requerant: string;
  dateReception: string;
  dateCloture?: string;
  echeanceLabel: string;
  echeanceWarning?: boolean;
  echeanceDays?: number;
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
  suiviCloture: SuiviCloture;
  notesInternes: string;
  historique: HistoriqueEntry[];
};

export const AVANCEMENT_LABEL: Record<Avancement, string> = {
  'a-traiter': 'À traiter',
  'sans-suite': 'Sans suite',
  cloture: 'Clôturé',
};

export const AVANCEMENT_TOOLTIP: Record<Avancement, string> = {
  'a-traiter': 'Le dossier est en cours de traitement.',
  'sans-suite': 'Dossier classé sans suite, faute de réponse du réclamant.',
  cloture: 'Dossier traité : la réponse définitive a été envoyée au réclamant.',
};

// The "En attente" chip is a UI-only sub-state of 'a-traiter' (see
// `enAttente` in ComplaintDetailDrawer) — not a real Avancement value, so it
// needs its own tooltip text rather than living in AVANCEMENT_TOOLTIP.
export const EN_ATTENTE_TOOLTIP = "En attente d'une réponse du réclamant suite à une demande de contact.";

export const CONFORMITE_LABEL: Record<Conformite, string> = {
  conforme: 'Conforme',
  'non-conforme': 'Non conforme',
};

// Tolerant of both "D/M/YYYY" and zero-padded "DD/MM/YYYY" (and any
// single-char separator) — Date#toLocaleDateString('fr-FR') doesn't format
// identically across JS engines, so a strict "DD/MM/YYYY" match silently
// failed to parse dates produced by some browsers.
function parseFrDateLoose(value: string): Date | null {
  const match = value.match(/^(\d{1,2}).(\d{1,2}).(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

// Explains the "Conforme" / "Non conforme" chip on hover — conforme just
// restates the two regulatory deadlines, non-conforme names which one was
// missed and by how many days, computed from the dossier's actual dates
// rather than hardcoded, so it stays accurate as the mock data changes.
export function getConformiteTooltip(
  complaint: Pick<Complaint, 'conformite' | 'dateReception' | 'suiviCloture'>,
): string {
  if (complaint.conformite === 'conforme') {
    return 'Dans les délais réglementaires.';
  }

  const { dateReception, suiviCloture } = complaint;
  const reception = parseFrDateLoose(dateReception);
  if (reception) {
    const ar = parseFrDateLoose(suiviCloture.dateAR);
    const daysToAR = daysBetween(reception, ar ?? new Date());
    if (daysToAR > 10) {
      const overrun = daysToAR - 10;
      return `Accusé de réception envoyé ${daysToAR} jours après la réception, soit ${overrun} jour${overrun > 1 ? 's' : ''} au-delà du délai réglementaire de 10 jours ouvrables.`;
    }

    if (ar) {
      const reponse = parseFrDateLoose(suiviCloture.dateReponse);
      const daysToReponse = daysBetween(reception, reponse ?? new Date());
      if (daysToReponse > 60) {
        const overrun = daysToReponse - 60;
        return `Réponse définitive envoyée ${daysToReponse} jours après la réception, soit ${overrun} jour${overrun > 1 ? 's' : ''} au-delà du délai réglementaire de 2 mois.`;
      }
    }
  }

  return 'Délai réglementaire dépassé pour ce dossier.';
}

export const STATUT_CLIENT_LABEL: Record<StatutClient, string> = {
  souscripteur: 'Souscripteur',
  assure: 'Assuré',
  utilisateur: 'Utilisateur',
  beneficiaire: 'Bénéficiaire',
  representant: 'Représentant éventuel',
  tiers: 'Tiers',
};

export const STATUT_CLIENT_DESCRIPTION: Record<StatutClient, string> = {
  souscripteur: "La personne qui a signé le contrat d'assurance.",
  assure: 'La personne couverte par le contrat, qui peut être différente du souscripteur.',
  utilisateur: "La personne qui se sert concrètement du bien ou du service assuré, sans être signataire du contrat.",
  beneficiaire: "La personne désignée pour recevoir l'indemnisation en cas de sinistre.",
  representant: "Une personne mandatée pour agir au nom de l'assuré ou du souscripteur (tuteur, mandataire, avocat...).",
  tiers: 'Une personne extérieure au contrat, mais concernée par un sinistre ou impliquée dans la situation.',
};

type DossierStepStatus = 'done' | 'current' | 'upcoming' | 'skipped';

export type DossierStep = {
  label: string;
  status: DossierStepStatus;
  badgeLabel?: string;
  badgeWarning?: boolean;
};

// Where a complaint's file currently sits in its 5-stage lifecycle. Steps 0-1
// (mention received, complaint created) are implicit — a Complaint record
// existing at all means both already happened.
export function getDossierSteps(
  complaint: Pick<Complaint, 'avancement' | 'echeanceLabel' | 'echeanceWarning' | 'suiviCloture'>,
): DossierStep[] {
  const { avancement, echeanceLabel, echeanceWarning, suiviCloture } = complaint;

  // Sans-suite is its own terminal branch — the AR/réponse définitive steps
  // never happened, so they're shown as skipped rather than done.
  if (avancement === 'sans-suite') {
    return [
      { label: 'Réception de la mention', status: 'done', badgeLabel: 'Complété' },
      { label: 'Création de la réclamation', status: 'done', badgeLabel: 'Complété' },
      { label: "Confirmation de l'envoi de l'Accusé de Réception", status: 'skipped' },
      { label: 'Confirmation de l’envoi de la Réponse Définitive', status: 'skipped' },
      { label: 'Classement sans suite du dossier', status: 'done', badgeLabel: 'Complété' },
    ];
  }

  const arDone = suiviCloture.dateAR !== '' || avancement === 'cloture';
  // Clôture is now its own explicit step (see "Clôturer" in the drawer) —
  // sending la réponse définitive no longer auto-closes the dossier, so
  // this only depends on the date, not on avancement having advanced.
  const reponseDone = suiviCloture.dateReponse !== '' || avancement === 'cloture';
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

export const INTERLOCUTEURS = ['Julien Fontaine', 'Claire Martin', 'Marc Dubois', 'Sophie Leroy'];

// The "Confirmer l'envoi de l'accusé de réception" step can't be validated
// in the live app without rattacheContrat (and statutClient, once "oui")
// being answered first, so a mock dossier that has already passed that step
// needs those fields filled in too — otherwise reopening it shows required
// fields as unexpectedly empty.
const STATUT_CLIENT_CYCLE: StatutClient[] = [
  'souscripteur',
  'assure',
  'utilisateur',
  'beneficiaire',
  'representant',
  'tiers',
];

export type ComplaintCore = Omit<
  Complaint,
  'reclamant' | 'classification' | 'traitement' | 'suiviCloture' | 'notesInternes' | 'historique'
>;

const NOTES_TEMPLATES = [
  'Client injoignable au premier appel, message laissé. Rappel prévu sous 48h.',
  'Dossier suivi de près en raison du montant élevé du sinistre.',
  'Client sous contrat premium — traitement prioritaire demandé par le service commercial.',
  'Antécédent de réclamation similaire il y a 6 mois, à surveiller.',
];

const EDIT_ENTRIES: { title: string; description: string }[] = [
  { title: 'Modification des informations du réclamant', description: 'Numéro de téléphone ajouté suite à un appel de suivi.' },
  { title: 'Modification des informations du réclamant', description: 'Adresse postale complétée par le réclamant.' },
  { title: 'Modification du traitement / attribution', description: 'Dossier réattribué pour équilibrer la charge entre interlocuteurs.' },
  { title: 'Modification du suivi et clôture', description: 'Action corrective renseignée après validation du service qualité.' },
];

export function attachDetails(c: ComplaintCore, index = 0): Complaint {
  const [prenom, nom] = splitName(c.requerant);
  const porteurDuRisque = c.assureur;
  // A dossier can't reach these stages in the live app without the underlying
  // step being completed first, so the mock data has to reflect that instead
  // of leaving downstream fields blank on an already-advanced dossier.
  const arDone = c.avancement !== 'a-traiter';
  const reponseDone = c.avancement === 'sans-suite' || c.avancement === 'cloture';
  // toLocaleDateString('fr-FR') doesn't reliably zero-pad the day/month
  // (e.g. "9/6/2026"), but addDaysToFrDate below requires a strict 2-digit
  // format and silently returns '' otherwise — pad it first so dateAR/
  // dateReponse/dateCloture actually get computed.
  const dateReception = padFrDate(c.dateReception);
  // A "non-conforme" dossier needs an actual overrun in its dates, not just
  // the label — otherwise the conformité tooltip (which explains the
  // overrun from these dates) has nothing to point to and falls back to a
  // generic message.
  const dateAR = arDone ? addDaysToFrDate(dateReception, c.conformite === 'non-conforme' ? 14 : 3) : '';
  const dateReponse = reponseDone ? addDaysToFrDate(dateReception, 25) : '';
  const dateCloture = c.avancement === 'cloture' ? addDaysToFrDate(dateReponse, 5) : undefined;
  const interlocuteur = arDone ? INTERLOCUTEURS[index % INTERLOCUTEURS.length] : '';
  const rattacheContrat = arDone ? 'oui' : '';
  const statutClient = arDone ? STATUT_CLIENT_CYCLE[index % STATUT_CLIENT_CYCLE.length] : '';
  // Only a subset of dossiers get the extra activity — not every progressed
  // dossier had a manual edit or an internal note logged against it.
  const enriched = arDone && index % 3 === 0;

  const historique: HistoriqueEntry[] = [
    {
      title: 'Création de la réclamation',
      description: `Créée depuis une mention ${c.canal} — « ${c.objet} »`,
      date: dateReception,
      author: 'Système',
    },
  ];
  if (arDone) {
    historique.push({
      title: "Confirmation de l'envoi de l'Accusé de Réception",
      description: 'Accusé de réception envoyé au réclamant.',
      date: dateAR,
      author: 'Julien Fontaine',
    });
  }
  if (enriched) {
    const edit = EDIT_ENTRIES[index % EDIT_ENTRIES.length];
    historique.push({
      ...edit,
      date: addDaysToFrDate(dateAR, 2),
      author: interlocuteur,
    });
  }
  if (reponseDone) {
    historique.push({
      title: 'Confirmation de l’envoi de la Réponse Définitive',
      description: 'Réponse définitive envoyée au réclamant.',
      date: dateReponse,
      author: 'Julien Fontaine',
    });
  }

  return {
    ...c,
    dateReception,
    dateCloture,
    reclamant: {
      prenom,
      nom,
      email: c.email,
      telephone: '',
      adresse: '',
      rattacheContrat,
      statutClient,
    },
    classification: {
      porteurDuRisque,
      typeSinistre: '',
    },
    traitement: {
      statut: AVANCEMENT_LABEL[c.avancement],
      interlocuteur,
      priorite: '',
    },
    suiviCloture: {
      dateAR,
      dateReponse,
      demandeContactDate: '',
      actionImmediate: '',
      actionCorrective: '',
      actionRealisee: '',
      actionsCorrectives: '',
      verificationEfficacite: '',
    },
    notesInternes: enriched ? NOTES_TEMPLATES[index % NOTES_TEMPLATES.length] : '',
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

// Zero-pads a manually-typed "D/M/YYYY"-ish date string into "DD/MM/YYYY" —
// these date fields are plain text inputs, not native date pickers, so a
// user can type "1/9/2026" and it needs normalizing before it's stored or
// displayed. Leaves anything that doesn't look like a date untouched.
export function padFrDate(value: string): string {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return value;
  const [, day, month, year] = match;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

function addDaysToFrDate(value: string, days: number): string {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('fr-FR');
}

const TICKET_NUMBERS = [57, 1, 3, 24, 33, 12, 5, 7, 19, 41, 2, 9, 28, 15];
const AVANCEMENT_CYCLE: Avancement[] = [
  'a-traiter',
  'a-traiter',
  'a-traiter',
  'sans-suite',
  'a-traiter',
  'a-traiter',
  'cloture',
  'cloture',
  'a-traiter',
  'a-traiter',
  'a-traiter',
  'cloture',
  'a-traiter',
  'a-traiter',
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

const closedComplaintsCore: ComplaintCore[] = [
  {
    id: 'closed-001',
    ticket: '#0044',
    requerant: 'Isabelle Renaud',
    dateReception: formatDateReception(95),
    echeanceLabel: '',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: '',
    assureur: '',
    email: 'isabelle.renaud@gmail.com',
    objet: 'Remboursement sinistre automobile',
    description:
      "Réclamation relative au délai de remboursement suite à un sinistre automobile. Dossier traité et clôturé après versement de l'indemnisation le 14 janvier 2026.",
  },
  {
    id: 'closed-002',
    ticket: '#0038',
    requerant: 'Lucas Bernard',
    dateReception: formatDateReception(110),
    echeanceLabel: '',
    avancement: 'sans-suite',
    conformite: 'conforme',
    canal: 'Web',
    denominateurSocial: '',
    assureur: '',
    email: 'lucas.bernard@gmail.com',
    objet: 'Contestation de résiliation de contrat',
    description:
      "Le client contestait la résiliation de son contrat habitation. Après examen du dossier, la résiliation a été confirmée conforme aux conditions générales. Classé sans suite après accord du client.",
  },
  {
    id: 'closed-003',
    ticket: '#0031',
    requerant: 'Nathalie Vasseur',
    dateReception: formatDateReception(130),
    echeanceLabel: '',
    avancement: 'cloture',
    conformite: 'non-conforme',
    canal: 'Facebook',
    denominateurSocial: '',
    assureur: '',
    email: 'nathalie.vasseur@gmail.com',
    objet: 'Erreur de facturation sur prime annuelle',
    description:
      "Double prélèvement constaté sur le compte de la cliente. Erreur de facturation confirmée et remboursement effectué sous 5 jours ouvrés. Dossier clôturé avec geste commercial.",
  },
  {
    id: 'closed-004',
    ticket: '#0026',
    requerant: 'Arnaud Petit',
    dateReception: formatDateReception(148),
    echeanceLabel: '',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: '',
    assureur: '',
    email: 'arnaud.petit@gmail.com',
    objet: 'Délai de traitement excessif — dossier sinistre',
    description:
      "Réclamation portant sur un délai de traitement jugé trop long pour un sinistre dégât des eaux. Dossier finalisé après intervention de l'expert et versement de l'indemnisation.",
  },
  {
    id: 'closed-005',
    ticket: '#0018',
    requerant: 'Céline Morel',
    dateReception: formatDateReception(162),
    echeanceLabel: '',
    avancement: 'sans-suite',
    conformite: 'conforme',
    canal: 'X',
    denominateurSocial: '',
    assureur: '',
    email: 'celine.morel@gmail.com',
    objet: 'Absence de réponse du service client',
    description:
      "La cliente signalait une absence de réponse à ses sollicitations. Après contact, il s'est avéré que les emails étaient redirigés dans les spams. Classé sans suite après résolution.",
  },
  {
    id: 'closed-006',
    ticket: '#0014',
    requerant: 'Julien Garnier',
    dateReception: formatDateReception(178),
    echeanceLabel: '',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: '',
    assureur: '',
    email: 'julien.garnier@gmail.com',
    objet: 'Litige sur un devis de réparation',
    description:
      "Le client contestait un écart entre le devis initial et la facture finale pour une réparation de toiture. Après médiation avec le prestataire, un avoir a été accordé et le dossier clôturé.",
  },
  {
    id: 'closed-007',
    ticket: '#0011',
    requerant: 'Marie-Claire Dupuis',
    dateReception: formatDateReception(195),
    echeanceLabel: '',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Web',
    denominateurSocial: '',
    assureur: '',
    email: 'mariec.dupuis@gmail.com',
    objet: 'Retard de remboursement frais médicaux',
    description:
      "Réclamation portant sur un remboursement de frais médicaux tardif. Le virement a été effectué dans les délais réglementaires après correction d'une erreur de RIB. Dossier clôturé.",
  },
  {
    id: 'closed-008',
    ticket: '#0008',
    requerant: 'Thierry Blanchard',
    dateReception: formatDateReception(210),
    echeanceLabel: '',
    avancement: 'sans-suite',
    conformite: 'non-conforme',
    canal: 'Facebook',
    denominateurSocial: '',
    assureur: '',
    email: 'thierry.blanchard@gmail.com',
    objet: 'Demande de résiliation de contrat',
    description:
      "Le client souhaitait résilier son contrat avec effet immédiat hors délai légal. Après examen, la demande n'entrait pas dans les cas de résiliation anticipée. Classé sans suite.",
  },
  {
    id: 'closed-009',
    ticket: '#0006',
    requerant: 'Sophie Aubert',
    dateReception: formatDateReception(225),
    echeanceLabel: '',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Instagram',
    denominateurSocial: '',
    assureur: '',
    email: 'sophie.aubert@gmail.com',
    objet: 'Suivi de dossier sinistre vol',
    description:
      "La cliente n'avait pas reçu de nouvelles de son dossier sinistre vol après 6 semaines. Après relance interne, l'expertise a été diligentée et l'indemnisation versée. Dossier clôturé.",
  },
  {
    id: 'closed-010',
    ticket: '#0004',
    requerant: 'François Lemaire',
    dateReception: formatDateReception(240),
    echeanceLabel: '',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: '',
    assureur: '',
    email: 'francois.lemaire@gmail.com',
    objet: 'Erreur de facturation — doublon de cotisation',
    description:
      "Double prélèvement de la cotisation annuelle constaté en janvier. Remboursement effectué sous 48h après vérification comptable. Le client a confirmé la réception du virement.",
  },
  {
    id: 'closed-011',
    ticket: '#0010',
    requerant: 'Élise Fontaine',
    dateReception: formatDateReception(258),
    echeanceLabel: '',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'LinkedIn',
    denominateurSocial: '',
    assureur: '',
    email: 'elise.fontaine@gmail.com',
    objet: 'Délai de traitement excessif — expertise',
    description:
      "Attente de plus de deux mois pour le passage de l'expert suite à un dégât des eaux. Dossier escaladé, expert mandaté en urgence. Indemnisation versée et clôture formalisée.",
  },
  {
    id: 'closed-012',
    ticket: '#0016',
    requerant: 'Marc Girard',
    dateReception: formatDateReception(275),
    echeanceLabel: '',
    avancement: 'sans-suite',
    conformite: 'conforme',
    canal: 'Web',
    denominateurSocial: '',
    assureur: '',
    email: 'marc.girard@gmail.com',
    objet: "Contestation clause d'exclusion",
    description:
      "Le client contestait l'application d'une clause d'exclusion de garantie suite à un sinistre. Après analyse juridique, la clause a été jugée applicable. Classé sans suite.",
  },
  {
    id: 'closed-013',
    ticket: '#0020',
    requerant: 'Patricia Chevalier',
    dateReception: formatDateReception(290),
    echeanceLabel: '',
    avancement: 'cloture',
    conformite: 'conforme',
    canal: 'Google',
    denominateurSocial: '',
    assureur: '',
    email: 'patricia.chevalier@gmail.com',
    objet: 'Absence de réponse — renouvellement contrat',
    description:
      "La cliente n'avait pas reçu ses documents de renouvellement malgré plusieurs relances. Erreur d'adresse email dans notre système. Corrigé et documents renvoyés. Dossier clôturé.",
  },
];

export const closedComplaints: Complaint[] = closedComplaintsCore.map((c, index) => attachDetails(c, index));

const complaintsCore: ComplaintCore[] = reclamations
  .filter((r) => r.state === 'mes-reclamations')
  .map((r, index) => {
    const avancement = AVANCEMENT_CYCLE[index % AVANCEMENT_CYCLE.length];
    const remainingDays = REMAINING_DAYS[index % REMAINING_DAYS.length];
    const isClosed = avancement === 'cloture' || avancement === 'sans-suite';
    const description = LONG_DESCRIPTIONS[index] ?? r.text;
    // Reaching this stage means the AR was already confirmed, which itself
    // requires a valid contact — a guessed-but-empty email can't survive
    // past "à traiter" in the mock data any more than it could live.
    const guessedEmail = guessEmail(r.author);
    const email =
      guessedEmail || (avancement === 'a-traiter' ? '' : `${stripDiacritics(splitName(r.author)[0] || 'contact')}.${index}@gmail.com`.toLowerCase());

    return {
      id: `complaint-${r.id}`,
      sourceReclamationId: r.id,
      ticket: `#${String(TICKET_NUMBERS[index % TICKET_NUMBERS.length]).padStart(4, '0')}`,
      requerant: r.author,
      dateReception: formatDateReception(index * 4 + 3),
      echeanceLabel: isClosed ? '' : `${remainingDays} jours restants`,
      echeanceWarning: !isClosed && remainingDays <= 9,
      echeanceDays: isClosed ? undefined : remainingDays,
      avancement,
      conformite: index === 9 ? 'non-conforme' : 'conforme',
      canal: r.source,
      sourceUrl: r.url.replace(/\.{3}$/, ''),
      denominateurSocial: '',
      assureur: '',
      email,
      objet: suggestObjet(description),
      description,
    };
  });

export const complaints: Complaint[] = complaintsCore.map((c, index) => attachDetails(c, index));
