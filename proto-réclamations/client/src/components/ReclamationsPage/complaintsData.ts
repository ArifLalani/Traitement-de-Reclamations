import type { Source } from './SourceIcon';
import { reclamations } from './data';

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
  sourceUrl?: string;
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
  'en-cours',
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

export const complaints: Complaint[] = reclamations
  .filter((r) => r.state === 'mes-reclamations')
  .map((r, index) => {
    const avancement = AVANCEMENT_CYCLE[index % AVANCEMENT_CYCLE.length];
    const remainingDays = REMAINING_DAYS[index % REMAINING_DAYS.length];
    const isClosed = avancement === 'cloture';
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
