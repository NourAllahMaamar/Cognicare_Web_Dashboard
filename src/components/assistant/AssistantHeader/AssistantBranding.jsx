import cogniThinking from '../../../assets/cogni/cogni-thinking.png';
import { metaLabel, metaTimestamp } from '../../../utils/assistant/metaHelpers';

/**
 * AssistantBranding
 *
 * Displays the Cogni character avatar, assistant badge, title, subtitle,
 * and latest-response metadata in the assistant panel header.
 *
 * @param {object}   props.latestMeta - AssistantMeta from the most recent response (or null)
 * @param {boolean}  props.isRtl      - Whether the current locale is RTL
 * @param {function} props.t          - i18next translation function
 * @param {object}   props.i18n       - i18next instance (used for i18n.language)
 */
export default function AssistantBranding({ latestMeta, isRtl, t, i18n }) {
  return (
    <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
      {/* Cogni Avatar - larger, more polished */}
      <div className="relative flex-shrink-0">
        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-primary/10 ring-2 ring-primary/20 shadow-lg">
          <img
            src={cogniThinking}
            alt="Cogni"
            className="h-full w-full object-cover"
          />
        </div>
        {/* Live indicator dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-white dark:border-slate-900"
          aria-hidden="true"
        />
      </div>

      {/* Text content */}
      <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
        {/* Assistant badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
          <span
            className="material-symbols-outlined text-[13px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            bolt
          </span>
          {t('dashboardAssistant.assistantTag', 'Assistant')}
        </div>

        {/* Title */}
        <h3 className="mt-2.5 text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
          {t('dashboardAssistant.title', 'Cogni Dashboard Assistant')}
        </h3>

        {/* Subtitle */}
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t(
            'dashboardAssistant.subtitle',
            'Read-only support for the current dashboard view.',
          )}
        </p>

        {/* Meta info */}
        {latestMeta && (
          <p className="mt-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {metaLabel(latestMeta, t)} • {metaTimestamp(latestMeta, t, i18n.language)}
          </p>
        )}
      </div>
    </div>
  );
}
