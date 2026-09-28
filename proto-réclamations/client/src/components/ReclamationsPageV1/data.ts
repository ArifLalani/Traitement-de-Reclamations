import type { Source } from './SourceIcon';

export type ReclamationState = 'possible' | 'a-traiter' | 'declinee' | 'mes-reclamations';

export type Reclamation = {
  id: string;
  state: ReclamationState;
  isNew: boolean;
  source: Source;
  date: string;
  url: string;
  author: string;
  rating: number | null;
  text: string;
};

export type Sentiment = 'negative' | 'neutral' | 'positive';

const NEGATIVE_KEYWORDS = [
  'déçu',
  'décu',
  'insatisfait',
  'frustrant',
  'inadmissible',
  'aucune réponse',
  'aucune nouvelle',
  'aucune indemnisation',
  'aucun retour',
  'sans succès',
  'sans succes',
  'sans suite',
  'ne recommande pas',
  'ne fonctionne pas',
  'incorrecte',
  'ne correspond pas',
  'résilié',
  'resilie',
  'non résolus',
  'non resolus',
  'bloqué',
  'bloque',
  'mécontent',
  'mecontent',
  'trop long',
  'pas du tout',
  'jamais',
  'toujours en attente',
  'retard',
  'préoccupante',
  'preoccupante',
  'complique',
  'compliqué',
];

const POSITIVE_KEYWORDS = [
  'globalement satisfait',
  'très satisfait',
  'satisfait',
  'très professionnel',
  'professionnel',
  'bonne prise en charge',
  'rapide',
  'résolu',
  'resolu',
  'merci',
  'sympathique',
  'recommande',
];

// Derives a smiley sentiment directly from the mention's text — the star
// rating alone doesn't reflect tone for sources that never carry one.
export function getSentiment(text: string): Sentiment {
  const normalized = text.toLowerCase();
  const negativeScore = NEGATIVE_KEYWORDS.filter((word) => normalized.includes(word)).length;
  const positiveScore = POSITIVE_KEYWORDS.filter((word) => normalized.includes(word)).length;
  if (negativeScore > positiveScore) return 'negative';
  if (positiveScore > negativeScore) return 'positive';
  return 'neutral';
}

const curated: Reclamation[] = [
  {
    id: '1',
    state: 'possible',
    isNew: true,
    source: 'Facebook',
    date: 'Hier à 14:32',
    url: 'www.facebook.com/assurance/2154231ef...',
    author: 'User unknown',
    rating: 1,
    text: "Je suis vraiment très déçu par votre service. Mon dossier de remboursement est bloqué depuis 6 semaines, et je n'ai reçu aucune réponse à mes appels malgré mes nombreuses relances par téléphone et par email. J'ai l'impression de parler dans le vide et personne ne semble vouloir prendre en charge mon dossier sérieusement. J'espère que vous pourrez résoudre ce problème rapidement. J'attends une mise à jour de votre part avant d'envisager d'autres démarches plus officielles.",
  },
  {
    id: '2',
    state: 'a-traiter',
    isNew: true,
    source: 'Google',
    date: 'Il y a 5 minutes',
    url: 'www.google.com/maps/reviews/avis/389021...',
    author: 'Marc D.',
    rating: 2,
    text: "L'agence ne répond jamais au téléphone. J'ai laissé 3 messages cette semaine sans aucun retour, et chaque fois qu'on me transfère vers un conseiller, je tombe sur une messagerie vocale. Très déçu de la gestion de mon sinistre, je pensais que ce serait beaucoup plus rapide vu le contrat premium que j'ai souscrit il y a deux ans avec vous.",
  },
  {
    id: '3',
    state: 'declinee',
    isNew: false,
    source: 'Trustpilot',
    date: '12/06/2026 à 18:05',
    url: 'fr.trustpilot.com/review/assurance-os...',
    author: 'Sophie L.',
    rating: 2,
    text: "Délais de traitement vraiment trop longs pour un simple changement d'adresse. Le service client est sympathique mais visiblement pas assez nombreux pour absorber la demande. J'ai dû rappeler trois fois avant d'obtenir une confirmation écrite, ce qui n'est clairement pas à la hauteur de ce qu'on attend d'un assureur.",
  },
  {
    id: '4',
    state: 'possible',
    isNew: true,
    source: 'X',
    date: 'Il y a 3h',
    url: 'x.com/clientmecontent/status/178293...',
    author: '@clientmecontent',
    rating: null,
    text: "@AssuranceOS toujours aucune nouvelle de mon dossier ouvert il y a un mois. C'est inadmissible pour une assurance censée protéger ses clients.",
  },
  {
    id: '5',
    state: 'a-traiter',
    isNew: false,
    source: 'Instagram',
    date: 'Il y a 2 jours',
    url: 'instagram.com/p/Cz8f2kLrT9m...',
    author: 'julie.martin_92',
    rating: null,
    text: "Commentaire sous notre publicité : Franchement entre les frais cachés et le temps de réponse, je ne recommande pas du tout cette assurance à mes proches.",
  },
  {
    id: '6',
    state: 'declinee',
    isNew: false,
    source: 'LinkedIn',
    date: '08/06/2026 à 11:40',
    url: 'linkedin.com/posts/thomas-perrin_assurance...',
    author: 'Thomas Perrin',
    rating: null,
    text: "Mon entreprise a résilié son contrat suite à plusieurs incidents non résolus avec leur service de gestion des sinistres professionnels. Malgré plusieurs relances de notre comptable et un dossier complet transmis dès le premier mois, aucune action concrète n'a été engagée avant notre décision de changer de prestataire.",
  },
  {
    id: '7',
    state: 'possible',
    isNew: false,
    source: 'Web',
    date: '05/06/2026 à 16:22',
    url: 'forum-assures.fr/sujet/avis-assurance-os...',
    author: 'PatriceR78',
    rating: 4,
    text: "Globalement satisfait du contrat auto depuis plusieurs années, mais j'ai eu une mauvaise expérience récente avec le remboursement d'un pare-brise, traité avec 3 semaines de retard alors que le devis avait été validé rapidement. J'espère que ce n'était qu'un incident isolé car le reste du service a toujours été correct jusqu'à présent.",
  },
];

export const sources: Source[] = ['Facebook', 'Google', 'X', 'Trustpilot', 'Instagram', 'LinkedIn', 'Web'];

const authors = [
  'Nadia K.',
  'Karim B.',
  'Laura T.',
  'Vincent M.',
  'Émilie R.',
  'David S.',
  'Claire F.',
  '@assure_mecontent',
  'paul.durand44',
  'Inès O.',
  'Julien P.',
  'sandra.b',
  'Mehdi L.',
  'Anaïs G.',
];

const dates = [
  'Il y a 8 minutes',
  'Il y a 35 minutes',
  'Il y a 1h',
  'Il y a 4h',
  'Hier à 10:18',
  'Hier à 17:45',
  'Il y a 2 jours',
  'Il y a 3 jours',
  '01/06/2026 à 09:30',
  '03/06/2026 à 14:12',
  '06/06/2026 à 11:05',
  '10/06/2026 à 16:40',
  '14/06/2026 à 08:55',
  '18/06/2026 à 13:20',
];

const texts = [
  "Toujours aucune réponse de votre part suite à ma réclamation envoyée la semaine dernière. C'est très frustrant de devoir relancer plusieurs fois pour obtenir un simple accusé de réception.",
  "Le conseiller a été très professionnel mais le délai de traitement reste anormalement long pour ce type de dossier, j'espère une résolution rapide dans les prochains jours.",
  "Sinistre déclaré il y a un mois, toujours aucune indemnisation. Le suivi en ligne n'est jamais mis à jour, je dois appeler à chaque fois pour avoir une information.",
  "Très bonne prise en charge initiale, mais depuis la transmission à un autre service, plus aucune nouvelle. J'aimerais un point précis sur l'avancement de mon dossier.",
  "Facturation incorrecte sur mon contrat ce mois-ci, j'ai contacté le service client qui m'a confirmé l'erreur mais rien n'a encore été corrigé sur mon espace client.",
  "Le remboursement reçu ne correspond pas du tout au montant indiqué dans le devis validé initialement. Pouvez-vous vérifier ce point rapidement ?",
  "Échange téléphonique correct mais aucune trace écrite de notre conversation, ce qui complique le suivi. Merci de me confirmer les éléments discutés par email.",
  "Plusieurs tentatives de contact sans succès cette semaine. Le formulaire en ligne semble également ne pas fonctionner correctement sur mobile.",
  "Dossier transmis depuis 3 semaines pour un dégât des eaux, toujours en attente de l'expert. Le délai annoncé initialement n'a clairement pas été respecté.",
  "Service rendu satisfaisant dans l'ensemble mais la communication pourrait être largement améliorée, notamment sur les délais de traitement annoncés.",
];

const ratings: (number | null)[] = [1, 2, 3, 4, 5, null, 2, null, 3, 1, null, 4];

function generate(state: ReclamationState, count: number, startId: number): Reclamation[] {
  return Array.from({ length: count }, (_, i) => {
    const n = startId + i;
    const source = sources[n % sources.length];
    return {
      id: `${state}-${n}`,
      state,
      isNew: i < 2,
      source,
      date: dates[n % dates.length],
      url: `${source.toLowerCase()}.com/assurance-os/dossier-${1000 + n}...`,
      author: authors[n % authors.length],
      rating: ratings[n % ratings.length],
      text: texts[n % texts.length],
    };
  });
}

export function parseDateValue(date: string): number {
  const now = new Date();

  if (date.startsWith("Aujourd'hui")) {
    const m = date.match(/(\d{2}):(\d{2})/);
    const d = new Date(now);
    if (m) d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d.getTime();
  }

  if (date.startsWith('Hier')) {
    const m = date.match(/(\d{2}):(\d{2})/);
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    if (m) d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d.getTime();
  }

  const minutesMatch = date.match(/Il y a (\d+) minutes?/);
  if (minutesMatch) return now.getTime() - Number(minutesMatch[1]) * 60_000;

  const hoursMatch = date.match(/Il y a (\d+)h/);
  if (hoursMatch) return now.getTime() - Number(hoursMatch[1]) * 3_600_000;

  const daysMatch = date.match(/Il y a (\d+) jours?/);
  if (daysMatch) return now.getTime() - Number(daysMatch[1]) * 86_400_000;

  const absoluteMatch = date.match(/(\d{2})\/(\d{2})\/(\d{4}) à (\d{2}):(\d{2})/);
  if (absoluteMatch) {
    const [, day, month, year, hh, mm] = absoluteMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hh), Number(mm)).getTime();
  }

  return 0;
}

const sorted: Reclamation[] = [
  ...curated,
  ...generate('possible', 4, 100),
  ...generate('a-traiter', 33, 200),
  ...generate('declinee', 5, 300),
  ...generate('mes-reclamations', 14, 400),
].sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));

// A mention only just posted hasn't been seen by anyone yet, so it defaults
// to unread — this must scale with recency, not with a fixed headcount,
// otherwise a mention from "il y a 5 minutes" could wrongly land outside an
// arbitrary top-N cut and show up already "read".
const UNREAD_WINDOW_MS = 3 * 60 * 60 * 1000;

export const reclamations: Reclamation[] = sorted.map((r) => {
  // "mes-reclamations" mentions were already converted into a complaint and
  // never show the unread indicator.
  if (r.state === 'mes-reclamations') return { ...r, isNew: false };
  const isRecent = Date.now() - parseDateValue(r.date) <= UNREAD_WINDOW_MS;
  return { ...r, isNew: isRecent };
});
