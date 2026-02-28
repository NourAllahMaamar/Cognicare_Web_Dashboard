export default function StatusBadge({ status, className = '' }) {
  const styles = {
    operational: 'bg-success/20 text-success',
    active: 'bg-success/20 text-success',
    approved: 'bg-success/20 text-success',
    'on-track': 'bg-success/20 text-success',
    improved: 'bg-success/20 text-success',
    pending: 'bg-warning/20 text-warning',
    'needs-attention': 'bg-warning/20 text-warning',
    medium: 'bg-warning/20 text-warning',
    warning: 'bg-warning/20 text-warning',
    high: 'bg-error/20 text-error',
    rejected: 'bg-error/20 text-error',
    error: 'bg-error/20 text-error',
    suspended: 'bg-error/20 text-error',
    low: 'bg-success/20 text-success',
    stable: 'bg-primary/20 text-primary',
    info: 'bg-primary/20 text-primary',
  };

  const key = status?.toLowerCase?.() || 'info';
  const style = styles[key] || styles.info;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${style} ${className}`}>
      {status}
    </span>
  );
}
