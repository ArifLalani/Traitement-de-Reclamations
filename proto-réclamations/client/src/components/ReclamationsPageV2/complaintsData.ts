import type { Source } from './SourceIcon';
import { reclamations } from './data';

export type Avancement = 'a-traiter' | 'cloture';
export type Conformite = 'conforme' | 'non-conforme';
export type StatutClient = 'souscripteur' | 'assure' | 'beneficiaire' | 'representant' | 'tiers';
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
  // The actual wording of the réponse définitive sent to the réclamant —
  // retranscribed here for the record, alongside the date it was sent.
  reponseMessage: string;
  // Set when the "Confirmer la demande" fallback is used instead of the AR
  // (réclamant contact info missing) — puts the dossier in the "En attente"
  // sub-state until that info is filled in or the dossier is closed.
  demandeContactDate: string;
  actionImmediate: string;
  actionCorrective: string;
  actionRealisee: string;
  actionsCorrectives: string;
  // Analyse de la cause — free-form, all optional.
  exigence: string;
  defaillance: string;
  preuve: string;
  verificationEfficacite: string;
  // Set once "Analyse de la cause" is confirmed — its fields are all
  // optional, so their emptiness can't be used to tell the step is done.
  analyseTerminee: boolean;
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

// Which of the three "Quelle option correspond à votre situation ?" canaux
// led to this réclamation — only ever set while its author is still
// unidentified (see CreateReclamationSlider's getCanalBranch); lets
// reopening it from "Non identifiés" resume the right continuation
// (en attente for plateforme, clôturée for administrateur/rien) instead of
// starting the guiding questions over from scratch.
export type MentionCanal = 'plateforme' | 'administrateur' | 'rien';

export type Complaint = {
  id: string;
  sourceReclamationId?: string;
  sourceCanal?: MentionCanal;
  ticket: string;
  requerant: string;
  dateReception: string;
  dateCloture?: string;
  avancement: Avancement;
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
  cloture: 'Clôturé',
};

export const AVANCEMENT_TOOLTIP: Record<Avancement, string> = {
  'a-traiter': 'Le dossier est en cours de traitement.',
  cloture: 'Dossier traité : la réponse définitive a été envoyée au réclamant.',
};

// The "En attente" chip is a UI-only sub-state of 'a-traiter' (see
// `enAttente` in ComplaintDetailDrawer) — not a real Avancement value, so it
// needs its own tooltip text rather than living in AVANCEMENT_TOOLTIP.
export const EN_ATTENTE_TOOLTIP = "En attente d'une réponse du réclamant suite à une demande de contact.";

export type ContactFilter = 'tous' | 'prospect' | 'client';

// "Non" to "rattaché à un contrat" means the author isn't a client yet —
// a prospect. "Oui" means they are, tagged as soon as that answer is given;
// the follow-up statut du client is only extra detail, not a condition for
// the tag. This distinction matters: a client is bound by the ACPR
// deadlines and reminder notifications the rest of the app enforces, while
// a prospect isn't under any such time constraint.
export function getContactTag(
  rattacheContrat: 'oui' | 'non' | '' | null | undefined,
): 'Prospect' | 'Client' | null {
  if (rattacheContrat === 'non') return 'Prospect';
  if (rattacheContrat === 'oui') return 'Client';
  return null;
}

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

// ACPR's two regulatory deadlines, both counted from the date the mention
// was received.
const AR_DEADLINE_DAYS = 10;
const REPONSE_DEADLINE_DAYS = 60;

type DeadlineJudgement = { onTime: boolean; daysRemaining: number; isEntered: boolean };

// A date already entered is judged on its own timing (permanent — doesn't
// drift as "today" moves on); with no date yet, the countdown is judged
// against today (live — a day late today may not have been a day late
// yesterday).
function judgeDeadline(reception: Date, dateValue: string, deadlineDays: number, today: Date): DeadlineJudgement {
  const entered = parseFrDateLoose(dateValue);
  const daysElapsed = entered ? daysBetween(reception, entered) : daysBetween(reception, today);
  return { onTime: daysElapsed <= deadlineDays, daysRemaining: deadlineDays - daysElapsed, isEntered: entered !== null };
}

export type EcheanceInfo = {
  conformite: Conformite;
  // Empty once there's nothing left to count down to (prospect, or the
  // dossier has both its dates in, or is clôturé) — ComplaintCard treats an
  // empty label as "closed".
  echeanceLabel: string;
  echeanceWarning: boolean;
  echeanceDays?: number;
};

// The single source of truth for a dossier's ACPR compliance: whether it's
// within the AR/réponse deadlines, and what to show as the running
// countdown. Prospects (rattachéContrat "non") aren't bound by either
// deadline, so they always come back conforme with nothing to display —
// "il faut juste que ce soit traité", no regulatory clock.
//
// A deadline that's already passed without the corresponding date filled in
// shows up as non-conforme right away, not only once the date is entered —
// and entering a date afterwards can still bring it back to conforme, if
// that date itself turns out to be within the deadline.
export function getEcheanceInfo(
  complaint: Pick<Complaint, 'dateReception' | 'suiviCloture' | 'avancement' | 'reclamant'>,
  today: Date = new Date(),
): EcheanceInfo {
  const { dateReception, suiviCloture, avancement, reclamant } = complaint;

  if (reclamant.rattacheContrat !== 'oui') {
    return { conformite: 'conforme', echeanceLabel: '', echeanceWarning: false };
  }

  const reception = parseFrDateLoose(dateReception);
  if (!reception) {
    return { conformite: 'conforme', echeanceLabel: '', echeanceWarning: false };
  }

  const ar = judgeDeadline(reception, suiviCloture.dateAR, AR_DEADLINE_DAYS, today);
  const reponse = judgeDeadline(reception, suiviCloture.dateReponse, REPONSE_DEADLINE_DAYS, today);
  const conformite: Conformite = ar.onTime && reponse.onTime ? 'conforme' : 'non-conforme';

  if (avancement === 'cloture' || (ar.isEntered && reponse.isEntered)) {
    return { conformite, echeanceLabel: '', echeanceWarning: false };
  }

  // Whichever phase is still open drives the badge — the AR's, until it's
  // entered, then the réponse's.
  const active = ar.isEntered ? reponse : ar;
  const label =
    active.daysRemaining >= 0
      ? `${active.daysRemaining} jour${active.daysRemaining > 1 ? 's' : ''} restant${active.daysRemaining > 1 ? 's' : ''}`
      : `Délai dépassé de ${-active.daysRemaining} jour${-active.daysRemaining > 1 ? 's' : ''}`;

  return { conformite, echeanceLabel: label, echeanceWarning: !active.onTime, echeanceDays: active.daysRemaining };
}

// Explains the "Conforme" / "Non conforme" chip on hover — computed from the
// same dates/deadlines as getEcheanceInfo, so the two can't drift apart.
export function getConformiteTooltip(
  complaint: Pick<Complaint, 'dateReception' | 'suiviCloture' | 'avancement' | 'reclamant'>,
): string {
  if (complaint.reclamant.rattacheContrat !== 'oui') {
    return "Pas de délai réglementaire : l'auteur n'est pas rattaché à un contrat.";
  }

  if (getEcheanceInfo(complaint).conformite === 'conforme') {
    return 'Dans les délais réglementaires.';
  }

  const { dateReception, suiviCloture } = complaint;
  const reception = parseFrDateLoose(dateReception);
  if (reception) {
    const today = new Date();
    const ar = parseFrDateLoose(suiviCloture.dateAR);
    const daysToAR = daysBetween(reception, ar ?? today);
    if (daysToAR > AR_DEADLINE_DAYS) {
      const overrun = daysToAR - AR_DEADLINE_DAYS;
      const overrunLabel = `${overrun} jour${overrun > 1 ? 's' : ''} au-delà du délai réglementaire de 10 jours ouvrables`;
      return ar
        ? `Accusé de réception envoyé ${daysToAR} jours après la réception, soit ${overrunLabel}.`
        : `Accusé de réception toujours pas envoyé ${daysToAR} jours après la réception, soit ${overrunLabel}.`;
    }

    const reponse = parseFrDateLoose(suiviCloture.dateReponse);
    const daysToReponse = daysBetween(reception, reponse ?? today);
    if (daysToReponse > REPONSE_DEADLINE_DAYS) {
      const overrun = daysToReponse - REPONSE_DEADLINE_DAYS;
      const overrunLabel = `${overrun} jour${overrun > 1 ? 's' : ''} au-delà du délai réglementaire de 2 mois`;
      return reponse
        ? `Réponse définitive envoyée ${daysToReponse} jours après la réception, soit ${overrunLabel}.`
        : `Réponse définitive toujours pas envoyée ${daysToReponse} jours après la réception, soit ${overrunLabel}.`;
    }
  }

  return 'Délai réglementaire dépassé pour ce dossier.';
}

export const STATUT_CLIENT_LABEL: Record<StatutClient, string> = {
  souscripteur: 'Souscripteur',
  assure: 'Assuré',
  beneficiaire: 'Bénéficiaire',
  representant: 'Représentant éventuel',
  tiers: 'Tiers',
};

export const STATUT_CLIENT_DESCRIPTION: Record<StatutClient, string> = {
  souscripteur: 'La personne qui signe le contrat et qui le paie.',
  assure: "La personne couverte par le contrat, sans être forcément celle qui l'a souscrit ni celle qui le paie.",
  beneficiaire:
    "La personne désignée pour bénéficier des garanties du contrat (ex : les enfants sur un contrat santé/mutuelle).",
  representant: "Une personne mandatée pour agir au nom de l'assuré ou du souscripteur (tuteur, mandataire...).",
  tiers: 'Une personne extérieure au contrat mais liée à la situation (ex : un garagiste non payé par l\'assurance).',
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
export function getDossierSteps(
  complaint: Pick<Complaint, 'avancement' | 'dateReception' | 'suiviCloture' | 'reclamant'>,
): DossierStep[] {
  const { avancement, suiviCloture } = complaint;
  const { echeanceLabel, echeanceWarning } = getEcheanceInfo(complaint);

  const arDone = suiviCloture.dateAR !== '' || avancement === 'cloture';
  // Confirming la réponse définitive now clôture the dossier in the same
  // action — there's no separate "Clôturer" click anymore.
  const reponseDone = suiviCloture.dateReponse !== '' || avancement === 'cloture';
  const clotureDone = avancement === 'cloture';
  // Analyse de la cause is an optional follow-up that happens once the
  // dossier is already clôturé — its fields are all optional, so being
  // "done" is tracked by its own confirmed flag rather than field content.
  const analyseDone = suiviCloture.analyseTerminee;

  return [
    { label: 'Réception de la mention', status: 'done', badgeLabel: 'Complété' },
    { label: 'Création de la réclamation', status: 'done', badgeLabel: 'Complété' },
    {
      label: "Confirmation de l'envoi de l'Accusé de Réception",
      status: arDone ? 'done' : 'current',
      badgeLabel: arDone ? 'Complété' : echeanceLabel || undefined,
      badgeWarning: !arDone && echeanceWarning,
    },
    {
      label: 'Confirmation de l’envoi de la Réponse Définitive',
      status: reponseDone ? 'done' : arDone ? 'current' : 'upcoming',
      badgeLabel: reponseDone ? 'Complété' : arDone ? echeanceLabel || undefined : undefined,
      badgeWarning: arDone && !reponseDone && echeanceWarning,
    },
    {
      label: 'Analyse de la cause',
      status: analyseDone ? 'done' : clotureDone ? 'current' : 'upcoming',
      badgeLabel: analyseDone ? 'Complété' : undefined,
    },
  ];
}

function splitName(fullName: string): [string, string] {
  const cleaned = fullName.replace(/^@/, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return [parts[0] ?? '', ''];
  return [parts[0], parts.slice(1).join(' ')];
}

// A mention's "author" is often a handle or a display name truncated to a
// last initial (e.g. "paul.durand44", "Inès O.") — fine for the mentions
// list, but not a real réclamant identity. Only a genuine "Prénom Nom" is
// trusted as-is; anything else falls back to the realistic pool below.
function looksLikeFullName(name: string): boolean {
  return /^[A-ZÀ-Ý][a-zà-ÿ'-]+\s+[A-ZÀ-Ý][a-zà-ÿ'-]+$/.test(name.trim());
}

const REALISTIC_PRENOMS = [
  'Inès', 'Paul', 'Sandra', 'Marc', 'Julien', 'Claire', 'Nadia', 'Laura',
  'Vincent', 'Céline', 'Arnaud', 'Thierry', 'François', 'Élise', 'Nathalie',
  'Luc', 'Isabelle', 'Mehdi', 'Anaïs', 'Émilie',
];
const REALISTIC_NOMS = [
  'Olivier', 'Durand', 'Martin', 'Bernard', 'Petit', 'Moreau', 'Dubois',
  'Fontaine', 'Leroy', 'Garnier', 'Chevalier', 'Lambert', 'Fabre', 'Meyer',
  'Girard', 'Andre', 'Mercier', 'Blanc', 'Guerin', 'Boyer',
];

// Deterministic per index (not random), so the same mock dossier always
// gets the same phone number across renders/sessions.
function generatePhone(index: number): string {
  const digits = String(10000000 + ((index * 7919) % 90000000)).padStart(8, '0');
  const prefix = index % 2 === 0 ? '06' : '07';
  return `${prefix} ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`;
}

export const INTERLOCUTEURS = ['Julien Fontaine', 'Claire Martin', 'Marc Dubois', 'Sophie Leroy'];

// The "Confirmer l'envoi de l'accusé de réception" step can't be validated
// in the live app without rattacheContrat (and statutClient, once "oui")
// being answered first, so a mock dossier that has already passed that step
// needs those fields filled in too — otherwise reopening it shows required
// fields as unexpectedly empty.
const STATUT_CLIENT_CYCLE: StatutClient[] = ['souscripteur', 'assure', 'beneficiaire', 'representant', 'tiers'];

export type ComplaintCore = Omit<
  Complaint,
  'reclamant' | 'classification' | 'traitement' | 'suiviCloture' | 'notesInternes' | 'historique'
> & {
  // Marks a handful of mock dossiers as prospects (rattaché à un contrat:
  // "non") rather than clients — the live flow answers this at création,
  // but mock data needs it hardcoded per entry.
  forceProspect?: boolean;
  // Gives an already-progressed mock dossier's AR a late send date — its
  // actual conformité is computed (getEcheanceInfo) from that date, not set
  // directly, so this only needs to pick which offset produces a late one.
  lateAR?: boolean;
};

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
  const hasRealName = looksLikeFullName(c.requerant);
  const [splitPrenom, splitNom] = splitName(c.requerant);
  const prenom = hasRealName ? splitPrenom : REALISTIC_PRENOMS[index % REALISTIC_PRENOMS.length];
  const nom = hasRealName ? splitNom : REALISTIC_NOMS[index % REALISTIC_NOMS.length];
  // c.email is already reliable once the author itself is a real name
  // (guessEmail/the fallback both derive it from "prénom nom" in that
  // case) — only regenerate it to match the réclamant identity above when
  // that name itself had to be made up.
  const email = hasRealName
    ? c.email
    : `${stripDiacritics(prenom)}.${stripDiacritics(nom)}@gmail.com`.toLowerCase();
  const telephone = generatePhone(index);
  const porteurDuRisque = c.assureur;
  // A dossier can't reach these stages in the live app without the underlying
  // step being completed first, so the mock data has to reflect that instead
  // of leaving downstream fields blank on an already-advanced dossier.
  const arDone = c.avancement !== 'a-traiter';
  const reponseDone = c.avancement === 'cloture';
  // toLocaleDateString('fr-FR') doesn't reliably zero-pad the day/month
  // (e.g. "9/6/2026"), but addDaysToFrDate below requires a strict 2-digit
  // format and silently returns '' otherwise — pad it first so dateAR/
  // dateReponse/dateCloture actually get computed.
  const dateReception = padFrDate(c.dateReception);
  const dateAR = arDone ? addDaysToFrDate(dateReception, c.lateAR ? 14 : 3) : '';
  const dateReponse = reponseDone ? addDaysToFrDate(dateReception, 25) : '';
  const dateCloture = c.avancement === 'cloture' ? addDaysToFrDate(dateReponse, 5) : undefined;
  const interlocuteur = arDone ? INTERLOCUTEURS[index % INTERLOCUTEURS.length] : '';
  // Unlike the AR/réponse dates above, these aren't downstream-only fields —
  // the live flow collects them upfront, at création (mention slider), so a
  // freshly-opened "a-traiter" mock dossier should have them too, not just
  // ones that already progressed further.
  const rattacheContrat = c.forceProspect ? 'non' : 'oui';
  const statutClient = rattacheContrat === 'oui' ? STATUT_CLIENT_CYCLE[index % STATUT_CLIENT_CYCLE.length] : '';
  // Only a subset of dossiers get the extra activity — not every progressed
  // dossier had a manual edit or an internal note logged against it.
  const enriched = arDone && index % 3 === 0;

  // Same contact-info detail a live-created réclamation's "Création de la
  // réclamation" entry gets from the mention slider — mocked dossiers need
  // it too, otherwise their historique reads as incomplete next to one
  // created through the real flow.
  const creationChanges = [
    { label: 'Prénom', value: prenom },
    { label: 'Nom', value: nom },
    { label: 'Email', value: email },
    { label: 'Dénomination sociale', value: c.denominateurSocial },
    { label: 'Assureur / Porteur du risque', value: porteurDuRisque },
    { label: 'Rattaché à un contrat', value: rattacheContrat === 'oui' ? 'Oui' : 'Non' },
    { label: 'Statut du client', value: statutClient ? STATUT_CLIENT_LABEL[statutClient] : '' },
  ].filter((change) => change.value.trim() !== '');

  const historique: HistoriqueEntry[] = [
    {
      title: 'Réception de la mention',
      description: `Mention reçue via ${c.canal}.`,
      date: dateReception,
      author: 'Système',
    },
    {
      title: 'Création de la réclamation',
      description: `Créée depuis une mention ${c.canal} — « ${c.objet} »`,
      date: dateReception,
      author: 'Système',
      changes: creationChanges,
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
    email,
    reclamant: {
      prenom,
      nom,
      email,
      telephone,
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
      reponseMessage: '',
      demandeContactDate: '',
      actionImmediate: '',
      actionCorrective: '',
      actionRealisee: '',
      actionsCorrectives: '',
      exigence: '',
      defaillance: '',
      preuve: '',
      verificationEfficacite: '',
      analyseTerminee: false,
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

const AVANCEMENT_CYCLE: Avancement[] = [
  'a-traiter',
  'a-traiter',
  'a-traiter',
  'cloture',
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
    avancement: 'cloture',
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
    avancement: 'cloture',
    canal: 'Web',
    denominateurSocial: '',
    assureur: '',
    email: 'lucas.bernard@gmail.com',
    objet: 'Contestation de résiliation de contrat',
    description:
      "Le client contestait la résiliation de son contrat habitation. Après examen du dossier, la résiliation a été confirmée conforme aux conditions générales. Dossier clôturé après accord du client.",
  },
  {
    id: 'closed-003',
    ticket: '#0031',
    requerant: 'Nathalie Vasseur',
    dateReception: formatDateReception(130),
    avancement: 'cloture',
    lateAR: true,
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
    avancement: 'cloture',
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
    avancement: 'cloture',
    canal: 'X',
    denominateurSocial: '',
    assureur: '',
    email: 'celine.morel@gmail.com',
    objet: 'Absence de réponse du service client',
    description:
      "La cliente signalait une absence de réponse à ses sollicitations. Après contact, il s'est avéré que les emails étaient redirigés dans les spams. Dossier clôturé après résolution.",
  },
  {
    id: 'closed-006',
    ticket: '#0014',
    requerant: 'Julien Garnier',
    dateReception: formatDateReception(178),
    avancement: 'cloture',
    forceProspect: true,
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
    avancement: 'cloture',
    forceProspect: true,
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
    avancement: 'cloture',
    lateAR: true,
    canal: 'Facebook',
    denominateurSocial: '',
    assureur: '',
    email: 'thierry.blanchard@gmail.com',
    objet: 'Demande de résiliation de contrat',
    description:
      "Le client souhaitait résilier son contrat avec effet immédiat hors délai légal. Après examen, la demande n'entrait pas dans les cas de résiliation anticipée. Dossier clôturé.",
  },
  {
    id: 'closed-009',
    ticket: '#0006',
    requerant: 'Sophie Aubert',
    dateReception: formatDateReception(225),
    avancement: 'cloture',
    forceProspect: true,
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
    avancement: 'cloture',
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
    avancement: 'cloture',
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
    avancement: 'cloture',
    canal: 'Web',
    denominateurSocial: '',
    assureur: '',
    email: 'marc.girard@gmail.com',
    objet: "Contestation clause d'exclusion",
    description:
      "Le client contestait l'application d'une clause d'exclusion de garantie suite à un sinistre. Après analyse juridique, la clause a été jugée applicable. Dossier clôturé.",
  },
  {
    id: 'closed-013',
    ticket: '#0020',
    requerant: 'Patricia Chevalier',
    dateReception: formatDateReception(290),
    avancement: 'cloture',
    canal: 'Google',
    denominateurSocial: '',
    assureur: '',
    email: 'patricia.chevalier@gmail.com',
    objet: 'Absence de réponse — renouvellement contrat',
    description:
      "La cliente n'avait pas reçu ses documents de renouvellement malgré plusieurs relances. Erreur d'adresse email dans notre système. Corrigé et documents renvoyés. Dossier clôturé.",
  },
];

// Réclamation tickets are their own numbering, bounded by how many
// réclamations actually exist (closedComplaintsCore + complaintsCore) —
// not the mention's own (much larger) numbering space, and not an
// unrelated, arbitrarily higher literal.
export const closedComplaints: Complaint[] = closedComplaintsCore.map((c, index) =>
  attachDetails({ ...c, ticket: `#${String(index + 1).padStart(4, '0')}` }, index),
);

const complaintsCore: ComplaintCore[] = reclamations
  .filter((r) => r.state === 'mes-reclamations')
  .map((r, index) => {
    const avancement = AVANCEMENT_CYCLE[index % AVANCEMENT_CYCLE.length];
    const description = LONG_DESCRIPTIONS[index] ?? r.text;
    // The réclamant's contact info is collected upfront, at création (mention
    // slider) — not gated behind a later step like AR confirmation — so even
    // a fresh "à traiter" dossier needs a real one, not an empty string a
    // guessed-from-author-name email happened to fail to produce.
    const guessedEmail = guessEmail(r.author);
    const email =
      guessedEmail || `${stripDiacritics(splitName(r.author)[0] || 'contact')}.${index}@gmail.com`.toLowerCase();

    return {
      id: `complaint-${r.id}`,
      sourceReclamationId: r.id,
      // Continues right after closedComplaints' own numbering, so every
      // réclamation ticket stays within 1..(total réclamation count)
      // instead of reusing the mention's own, much larger numbering space.
      ticket: `#${String(closedComplaintsCore.length + index + 1).padStart(4, '0')}`,
      requerant: r.author,
      dateReception: formatDateReception(index * 4 + 3),
      avancement,
      canal: r.source,
      sourceUrl: r.url.replace(/\.{3}$/, ''),
      denominateurSocial: '',
      assureur: '',
      email,
      objet: suggestObjet(description),
      description,
      forceProspect: index === 1 || index === 4,
    };
  });

export const complaints: Complaint[] = complaintsCore.map((c, index) => attachDetails(c, index));
