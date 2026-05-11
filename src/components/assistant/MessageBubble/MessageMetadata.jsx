import { metaLabel, metaTimestamp } from '../../../utils/assistant/metaHelpers';

/**
 * Displays strategy/complexity metadata for assistant messages.
 * Props: { meta, t, locale }
 */
export default function MessageMetadata({ meta, t, locale }) {
  if (!meta) return null;

  const strategyIcons = {
    default: 'bolt',
    cached: 'cached',
    lite_model: 'speed',
    smart_model: 'psychology',
  };

  const icon = strategyIcons[meta.strategy] ?? 'info';

  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
      <span
        className="material-symbols-outlined text-[13px]"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
      >
        {icon}
      </span>
      <span>
        {metaLabel(meta, t)} • {metaTimestamp(meta, t, locale)}
      </span>
    </div>
  );
}
