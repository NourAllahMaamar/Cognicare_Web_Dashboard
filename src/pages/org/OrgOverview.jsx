import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/ui/StatCard';
import { API_BASE_URL } from '../../config';

export default function OrgOverview() {
  const { t, i18n } = useTranslation();
  const { authGet } = useAuth('orgLeader');
  const [staff, setStaff] = useState([]);
  const [families, setFamilies] = useState([]);
  const [children, setChildren] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Progress AI
  const [specialistId, setSpecialistId] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, f, c, inv] = await Promise.all([
        authGet('/organization/my-organization/staff').catch(() => []),
        authGet('/organization/my-organization/families').catch(() => []),
        authGet('/organization/my-organization/children').catch(() => []),
        authGet('/organization/my-organization/invitations').catch(() => []),
      ]);
      setStaff(Array.isArray(s) ? s : []);
      setFamilies(Array.isArray(f) ? f : []);
      setChildren(Array.isArray(c) ? c : []);
      setInvitations(Array.isArray(inv) ? inv : []);
    } catch {}
    setLoading(false);
  };

  const fetchAiSummary = async () => {
    if (!specialistId.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const data = await authGet(`/progress-ai/summary/specialist/${specialistId.trim()}`);
      setAiSummary(data);
    } catch (err) { setAiError(err.message); setAiSummary(null); }
    setAiLoading(false);
  };

  const countRole = (role) => staff.filter(s => s.role === role).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">{t('orgDashboard.tabs.overview', 'Organization Overview')}</h2>
        <p className="text-slate-500 dark:text-text-muted mt-1">{t('orgDashboard.welcome', 'Welcome to your organization dashboard')}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={t('orgDashboard.totalStaff', 'Total Staff')} value={staff.length} icon="groups" />
            <StatCard label={t('orgDashboard.families', 'Families')} value={families.length} icon="family_restroom" />
            <StatCard label={t('orgDashboard.children', 'Children')} value={children.length} icon="child_care" />
            <StatCard label={t('orgDashboard.invitations', 'Invitations')} value={invitations.length} icon="mail" />
          </div>

          {/* Role Breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { role: 'psychologist', icon: 'psychology', label: t('roles.psychologist', 'Psychologists') },
              { role: 'speech_therapist', icon: 'record_voice_over', label: t('roles.speechTherapist', 'Speech Therapists') },
              { role: 'occupational_therapist', icon: 'accessibility_new', label: t('roles.occupationalTherapist', 'Occupational Therapists') },
              { role: 'doctor', icon: 'medical_services', label: t('roles.doctor', 'Doctors') },
              { role: 'volunteer', icon: 'volunteer_activism', label: t('roles.volunteer', 'Volunteers') },
              { role: 'other', icon: 'person', label: t('roles.other', 'Other') },
            ].map(r => (
              <div key={r.role} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                <span className="material-symbols-outlined text-2xl text-primary mb-1">{r.icon}</span>
                <p className="text-2xl font-black">{countRole(r.role)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.label}</p>
              </div>
            ))}
          </div>

          {/* Progress AI Section */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">psychology</span>
              {t('orgDashboard.progressAi', 'Progress AI Summary')}
            </h3>
            <div className="flex gap-3 mb-4">
              <input value={specialistId} onChange={e => setSpecialistId(e.target.value)} placeholder={t('orgDashboard.enterSpecialistId', 'Enter specialist ID...')} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              <button onClick={fetchAiSummary} disabled={aiLoading} className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50">
                {aiLoading ? '...' : t('common.fetch', 'Fetch')}
              </button>
            </div>
            {aiError && <p className="text-sm text-error mb-3">{aiError}</p>}
            {aiSummary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-primary/5 rounded-xl text-center">
                  <p className="text-2xl font-black text-primary">{aiSummary.totalPlans || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Plans</p>
                </div>
                <div className="p-4 bg-success/5 rounded-xl text-center">
                  <p className="text-2xl font-black text-success">{aiSummary.childrenCount || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Children</p>
                </div>
                <div className="p-4 bg-amber-500/5 rounded-xl text-center">
                  <p className="text-2xl font-black text-amber-500">{aiSummary.approvalRatePercent || 0}%</p>
                  <p className="text-xs text-slate-500 mt-1">Approval Rate</p>
                </div>
                <div className="p-4 bg-purple-500/5 rounded-xl text-center">
                  <p className="text-2xl font-black text-purple-500">{aiSummary.resultsImprovedRatePercent || 0}%</p>
                  <p className="text-xs text-slate-500 mt-1">Improvement Rate</p>
                </div>
                {aiSummary.planCountByType && Object.entries(aiSummary.planCountByType).map(([type, count]) => (
                  <div key={type} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-slate-500 capitalize">{type}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
