/**
 * Displays a relative or absolute timestamp for a message.
 * Props: { timestamp, locale }
 */
export default function MessageTimestamp({ timestamp, locale }) {
  if (!timestamp) return null;

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  let label;
  if (diffMs < 60000) {
    label = 'just now';
  } else if (diffMins < 60) {
    label = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    label = date.toLocaleTimeString(locale || undefined, { hour: '2-digit', minute: '2-digit' });
  } else {
    label = date.toLocaleDateString(locale || undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <time
      dateTime={date.toISOString()}
      className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500"
      title={date.toLocaleString(locale || undefined)}
    >
      {label}
    </time>
  );
}
