import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import logo from '../../assets/app_logo_withoutbackground.png';

const CONTACT_EMAIL = 'privacy@cognicare.app';

export default function LegalPage({ type }) {
  const { t, i18n } = useTranslation();
  const pageType = ['privacy', 'terms', 'deletion', 'standards'].includes(type) ? type : 'privacy';
  const page = {
    title: t(`legal.pages.${pageType}.title`),
    updated: t(`legal.pages.${pageType}.updated`),
    intro: t(`legal.pages.${pageType}.intro`),
    sections: t(`legal.pages.${pageType}.sections`, { returnObjects: true }),
  };
  const sections = Array.isArray(page.sections) ? page.sections : [];
  const isRtl = i18n.dir() === 'rtl';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100" dir={i18n.dir()}>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-3 font-bold text-slate-800 dark:text-slate-100">
            <img src={logo} alt="CogniCare" className="h-9 w-9 rounded-lg object-contain" />
            CogniCare
          </Link>
          <LanguageSwitcher />
        </div>

        <section className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 ${isRtl ? 'text-right' : 'text-left'}`}>
          <p className="text-sm font-semibold text-primary">{page.updated}</p>
          <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-950 dark:text-white sm:text-4xl">
            {page.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-700 dark:text-slate-300">{page.intro}</p>

          <div className="mt-8 space-y-7">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">{section.title}</h2>
                <p className="mt-2 leading-7 text-slate-700 dark:text-slate-300">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-lg bg-slate-100 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {t('legal.privacyContact')}: <a className="font-semibold text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </section>
      </div>
    </main>
  );
}
