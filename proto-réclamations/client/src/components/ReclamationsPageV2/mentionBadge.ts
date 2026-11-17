import type { ReclamationState } from './data';

// Badge/Mentions — the status tag at the top right of a mention card and of
// its detail panel. An open réclamation always says which kind it is:
// client (Code Rouge, tied to a contract, ACPR rules apply) or prospect
// (Code Orange, no contract, outside ACPR). Both share the same green style.
export type MentionBadgeVariant =
  | 'reclamation-ouverte'
  | 'reclamation-client-ouverte'
  | 'reclamation-prospect-ouverte'
  | 'en-attente'
  | 'cloturee';

export const MENTION_BADGES: Record<MentionBadgeVariant, {
  label: string;
  // Word set in bold within the label (the réclamation type).
  emphasis?: string;
  className: string;
  tooltip: string;
}> = {
  // Only while the réclamation's type isn't known yet (author still to
  // identify) — replaced by the client/prospect variant once it is.
  'reclamation-ouverte': {
    label: 'Réclamation ouverte',
    className: 'chip-mes-reclamations',
    tooltip: 'Une réclamation liée à cette mention a déjà été ouverte.',
  },
  'reclamation-client-ouverte': {
    label: 'Réclamation client ouverte',
    emphasis: 'client',
    className: 'chip-mes-reclamations',
    tooltip: 'Une réclamation client liée à cette mention a déjà été ouverte.',
  },
  'reclamation-prospect-ouverte': {
    label: 'Réclamation prospect ouverte',
    emphasis: 'prospect',
    className: 'chip-mes-reclamations',
    tooltip: 'Une réclamation prospect liée à cette mention a déjà été ouverte.',
  },
  'en-attente': {
    label: 'En attente',
    className: 'chip-en-attente',
    tooltip: "Une demande de coordonnées a été envoyée à l'auteur du commentaire, en attente de sa réponse.",
  },
  cloturee: {
    label: 'Clôturée',
    className: 'chip-cloturee',
    tooltip: "La demande n'a pas pu être traitée directement ; une demande a été transmise à l'administrateur de la plateforme.",
  },
};

// Picks the badge for a mention's (badge) state. An open réclamation whose
// type isn't known yet (author still to identify) keeps the generic
// "Réclamation ouverte" tag for now.
export function getMentionBadgeVariant(
  state: ReclamationState,
  contactTag: 'Client' | 'Prospect' | null | undefined,
): MentionBadgeVariant | null {
  switch (state) {
    case 'mes-reclamations':
      if (contactTag === 'Client') return 'reclamation-client-ouverte';
      if (contactTag === 'Prospect') return 'reclamation-prospect-ouverte';
      return 'reclamation-ouverte';
    case 'en-attente':
      return 'en-attente';
    case 'cloturee':
      return 'cloturee';
    default:
      return null;
  }
}
