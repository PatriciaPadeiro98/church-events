type MetricCardProps = {
  icon: string;
  label: string;
  value: string;
  variant?: 'teal' | 'yellow' | 'orange' | 'green';
};

export const MetricCard = ({
  icon,
  label,
  value,
  variant = 'teal',
}: MetricCardProps) => {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon-${variant}`}>{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
};