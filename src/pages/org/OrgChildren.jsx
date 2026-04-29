import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { exportTemplate, exportJson } from '../../utils/excelExport';

export default function OrgChildren() {
  const { t, i18n } = useTranslation();
  const { authGet } = useAuth('orgLeader');
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => { loadChildren(); }, []);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const data = await authGet('/organization/my-organization/children');
      setChildren(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const dateFmt = (d) => d ? new Date(d).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US') : '"”';

  const calcAge = (dob) => {
    if (!dob) return '"”';
    const diff = Date.now() - new Date(dob).getTime();
    const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    if (years > 0) {
      return t('orgDashboard.children.yearsShort', { count: years });
    }
    const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000));
    return t('orgDashboard.children.monthsShort', { count: months });
  };

  const downloadTemplate = async () => {
    await exportTemplate([
      t('orgDashboard.children.export.childName'),
      t('orgDashboard.children.export.dob'),
      t('orgDashboard.children.export.gender'),
      t('orgDashboard.children.export.parentEmail'),
      t('orgDashboard.children.export.diagnosis'),
      t('orgDashboard.children.export.medicalHistory'),
      t('orgDashboard.children.export.allergies'),
      t('orgDashboard.children.export.medications'),
      t('orgDashboard.children.export.notes')
    ], 'Children', 'cognicare_children_template.xlsx');
    setShowDropdown(false);
  };

  const exportChildren = async () => {
    const data = children.map(c => ({
      [t('orgDashboard.children.export.childName')]: c.fullName,
      [t('orgDashboard.children.export.dob')]: dateFmt(c.dateOfBirth),
      [t('orgDashboard.children.export.gender')]: c.gender || '',
      [t('orgDashboard.children.export.parentName')]: c.parentId?.fullName || c.parentName || '',
      [t('orgDashboard.children.export.parentEmail')]: c.parentId?.email || c.parentEmail || '',
      [t('orgDashboard.children.export.diagnosis')]: c.diagnosis || '',
      [t('orgDashboard.children.export.medicalHistory')]: c.medicalHistory || '',
      [t('orgDashboard.children.export.allergies')]: c.allergies || '',
      [t('orgDashboard.children.export.medications')]: c.medications || '',
      [t('orgDashboard.children.export.notes')]: c.notes || ''
    }));
    await exportJson(data, 'Children', 'children_export.xlsx');
    setShowDropdown(false);
  };

  const filtered = children.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.fullName || '').toLowerCase().includes(q) || (c.diagnosis || '').toLowerCase().includes(q) || (c.parentId?.fullName || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{t('orgDashboard.tabs.children', 'Children')}</h2>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{children.length} {t('orgDashboard.childrenRegistered', 'children registered')}</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <button onClick={() => setShowDropdown(!showDropdown)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined text-lg">import_export</span>
            <span className="hidden sm:inline">{t('common.importExport', 'Import/Export')}</span>
            <span className="sm:hidden">{t('orgDashboard.children.importExport')}</span>
          </button>
          {showDropdown && (
            <>
              <div className="sm:hidden fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 sm:w-48 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 shadow-xl z-20">
                <button onClick={exportChildren} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-xl">{t('orgDashboard.children.exportChildren')}</button>
                <button onClick={downloadTemplate} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-b-xl">{t('orgDashboard.children.downloadTemplate')}</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative w-full md:max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search', 'Search children...')} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-8 md:p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
          <span className="material-symbols-outlined text-4xl mb-2">child_care</span>
          <p className="text-sm md:text-base">{t('orgDashboard.noChildren', 'No children found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(child => (
            <div key={child._id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {(child.fullName || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{child.fullName}</p>
                  <p className="text-xs text-slate-500">{calcAge(child.dateOfBirth)} • {child.gender || '"”'}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">person</span>{child.parentId?.fullName || child.parentName || '"”'}</p>
                {child.diagnosis && <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">medical_information</span>{child.diagnosis}</p>}
                <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">cake</span>{dateFmt(child.dateOfBirth)}</p>
                {child.allergies && <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">warning</span>{child.allergies}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


