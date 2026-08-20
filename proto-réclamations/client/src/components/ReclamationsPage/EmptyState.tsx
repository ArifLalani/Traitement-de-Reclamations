type EmptyStateProps = {
  title: string;
  description: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-title">{title}</span>
      <p className="empty-state-description">{description}</p>
    </div>
  );
}
