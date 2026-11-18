// "Objet de la réclamation" — a fixed list of subjects the user picks exactly
// one of (radio list), instead of free text. Kept as an array in the data so
// the model doesn't change if several are allowed again. Placeholder values: the
// final list isn't settled yet (open question #5) and will evolve.
export const OBJET_OPTIONS = [
  'Retard de remboursement',
  'Délai de traitement',
  'Qualité de service',
  'Manque de transparence',
  "Manque d'accompagnement",
  'Mauvaise prise en charge du dossier',
  'Autre',
] as const;

export function formatObjets(objets: string[]): string {
  return objets.join(', ');
}

export function sameObjets(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

// Mock-data helper: picks the subject a free-text complaint most likely
// falls under, from keywords in its text.
const OBJET_KEYWORDS: [RegExp, (typeof OBJET_OPTIONS)[number]][] = [
  [/rembours|indemnis/i, 'Retard de remboursement'],
  [/délai|attente|semaine|mois|toujours aucun|retard|lent/i, 'Délai de traitement'],
  [/réponse|répond|contact|rappel|relance|appel|accompagn|nouvelle/i, "Manque d'accompagnement"],
  [/factur|montant|explication|clause|contradictoire|information|transparen|écart/i, 'Manque de transparence'],
  [/sinistre|expert|dossier|devis|résiliat|erreur/i, 'Mauvaise prise en charge du dossier'],
  [/conseiller|accueil|service client|professionnel|qualité|agence/i, 'Qualité de service'],
];

export function suggestObjets(text: string): string[] {
  const matches = OBJET_KEYWORDS.filter(([regex]) => regex.test(text))
    .map(([, objet]) => objet)
    .slice(0, 1);
  return matches.length ? matches : ['Autre'];
}
