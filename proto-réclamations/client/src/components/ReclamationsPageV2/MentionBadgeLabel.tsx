import { MENTION_BADGES, type MentionBadgeVariant } from './mentionBadge';

// Label of a Badge/Mentions tag, with the réclamation type ("client" /
// "prospect") set in bold when the variant has one.
export default function MentionBadgeLabel({ variant }: { variant: MentionBadgeVariant }) {
  const { label, emphasis } = MENTION_BADGES[variant];
  const index = emphasis ? label.indexOf(emphasis) : -1;
  if (!emphasis || index === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, index)}
      <strong className="cta-badge-emphasis">{emphasis}</strong>
      {label.slice(index + emphasis.length)}
    </>
  );
}
