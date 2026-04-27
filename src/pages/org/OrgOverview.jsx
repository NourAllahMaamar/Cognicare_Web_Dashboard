import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/ui/StatCard';
import { useDashboardAssistantContext } from '../../assistant/useDashboardAssistantContext';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts';

/* ─── colour palettes ─── */
const PLAN_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981'];
const FEEDBACK_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function OrgOverview() {
  const { t } = useTranslation();
  const { authGet } = useAuth('orgLeader');
  const { setUiContext } = useDashboardAssistantContext();

  /* ─── data state ─── */
  const [staff, setStaff] = useState([]);
  const [families, setFamilies] = useState([]);
  const [children, setChildren] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ─── progress-ai state ─── */
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const searchRef = useRef(null);

  /* ─── specialists filtered list ─── */
  const specialists = useMemo(() =>
    staff.filter(s =>
      ['psychologist', 'speech_therapist', 'occupational_therapist', 'doctor', 'careProvider', 'other'].includes(s.role)
    ), [staff]);

  const filteredSpecialists = useMemo(() => {
    if (!searchQuery.trim()) return specialists;
    const q = searchQuery.toLowerCase();
    return specialists.filter(s =>
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [specialists, searchQuery]);

  /* ─── close dropdown on outside click ─── */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── load org data ─── */
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
    } catch { /* silent */ }
    setLoading(false);
  };

  /* ─── fetch AI summary ─── */
  const fetchAiSummary = async (specialist) => {
    if (!specialist?._id) return;
    setSelectedSpecialist(specialist);
    setSearchQuery(specialist.fullName || specialist.email);
    setShowDropdown(false);
    setAiLoading(true);
    setAiError('');
    try {
      const data = await authGet(`/progress-ai/org/specialist/${specialist._id}/summary`);
      setAiSummary(data);
    } catch (err) {
      setAiError(err.message);
      setAiSummary(null);
    }
    setAiLoading(false);
  };

  const countRole = (role) => staff.filter(s => s.role === role).length;

  /* ─── chart data builders ─── */
  const planChartData = useMemo(() => {
    if (!aiSummary?.planCountByType) return [];
    return Object.entries(aiSummary.planCountByType)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [aiSummary]);

  const feedbackChartData = useMemo(() => {
    if (!aiSummary) return [];
    return [
      { name: t('orgDashboard.ai.approved', 'Approved'), value: aiSummary.approvedCount || 0 },
      { name: t('orgDashboard.ai.modified', 'Modified'), value: aiSummary.modifiedCount || 0 },
      { name: t('orgDashboard.ai.dismissed', 'Dismissed'), value: aiSummary.dismissedCount || 0 },
    ].filter(d => d.value > 0);
  }, [aiSummary, t]);

  const rateData = useMemo(() => {
    if (!aiSummary) return [];
    return [
      { name: t('orgDashboard.ai.improvementRate', 'Improvement'), value: aiSummary.resultsImprovedRatePercent || 0, fill: '#8b5cf6' },
      { name: t('orgDashboard.ai.approvalRate', 'Approval'), value: aiSummary.approvalRatePercent || 0, fill: '#06b6d4' },
    ];
  }, [aiSummary, t]);

  /* ─── role label helper ─── */
  const roleLabel = (role) => {
    const map = {
      psychologist: t('roles.psychologist', 'Psychologist'),
      speech_therapist: t('roles.speechTherapist', 'Speech Therapist'),
      occupational_therapist: t('roles.occupationalTherapist', 'Occupational Therapist'),
      doctor: t('roles.doctor', 'Doctor'),
      careProvider: t('roles.caregiver', 'Caregiver'),
      other: t('roles.other', 'Other'),
    };
    return map[role] || role;
  };

  useEffect(() => {
    setUiContext({
      page: 'org-overview',
      totalStaff: staff.length,
      totalFamilies: families.length,
      totalChildren: children.length,
      invitations: invitations.length,
      selectedSpecialist: selectedSpecialist
        ? {
            name: selectedSpecialist.fullName || '',
            role: selectedSpecialist.role || '',
          }
        : null,
      specialistSummary: aiSummary
        ? {
            totalPlans: aiSummary.totalPlans ?? 0,
            childrenCount: aiSummary.childrenCount ?? 0,
            approvalRatePercent: aiSummary.approvalRatePercent ?? 0,
            resultsImprovedRatePercent:
              aiSummary.resultsImprovedRatePercent ?? 0,
          }
        : null,
    });
  }, [
    aiSummary,
    children.length,
    families.length,
    invitations.length,
    selectedSpecialist,
    setUiContext,
    staff.length,
  ]);

  /* ─── custom tooltip ─── */
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-primary font-bold">{payload[0].value}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold">{t('orgDashboard.tabs.overview', 'Organization Overview')}</h2>
        <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{t('orgDashboard.welcome', 'Welcome to your organization dashboard')}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* ─── Stat Cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard label={t('orgDashboard.stats.totalStaff', 'Total Staff')} value={staff.length} icon="groups" />
            <StatCard label={t('orgDashboard.stats.totalFamilies', 'Families')} value={families.length} icon="family_restroom" />
            <StatCard label={t('orgDashboard.stats.totalChildren', 'Children')} value={children.length} icon="child_care" />
            <StatCard label={t('orgDashboard.stats.pendingInvites', 'Invitations')} value={invitations.length} icon="mail" />
          </div>

          {/* ─── Role Breakdown ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3">
            {[
              { role: 'psychologist', icon: 'psychology', label: t('roles.psychologist', 'Psychologists') },
              { role: 'speech_therapist', icon: 'record_voice_over', label: t('roles.speechTherapist', 'Speech Therapists') },
              { role: 'occupational_therapist', icon: 'accessibility_new', label: t('roles.occupationalTherapist', 'Occupational Therapists') },
              { role: 'doctor', icon: 'medical_services', label: t('roles.doctor', 'Doctors') },
              { role: 'careProvider', icon: 'volunteer_activism', label: t('roles.caregiver', 'Caregivers') },
              { role: 'other', icon: 'person', label: t('roles.other', 'Other') },
            ].map(r => (
              <div key={r.role} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-3 md:p-4 text-center shadow-sm hover:shadow-lg transition-all hover:scale-105">
                <span className="material-symbols-outlined text-xl md:text-2xl text-primary mb-1 flex-shrink-0">{r.icon}</span>
                <p className="text-xl md:text-2xl font-black">{countRole(r.role)}</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 truncate">{r.label}</p>
              </div>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════
              PROGRESS AI SECTION
             ═══════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 shadow-md p-4 md:p-6 transition-all">
            {/* Section header */}
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex-shrink-0">
                <span className="material-symbols-outlined text-lg md:text-xl">psychology</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base md:text-lg truncate">{t('orgDashboard.ai.title', 'Progress AI Insights')}</h3>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-text-muted truncate">{t('orgDashboard.ai.subtitle', 'Select a specialist to view AI-powered performance analytics')}</p>
              </div>
            </div>

            {/* ─── Search by Name ─── */}
            <div className="relative mb-4 md:mb-6" ref={searchRef}>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg flex-shrink-0">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); setSelectedSpecialist(null); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={t('orgDashboard.ai.searchPlaceholder', 'Search specialist by name...')}
                    className="w-full ps-10 pe-4 py-2 md:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedSpecialist(null); setAiSummary(null); setAiError(''); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
                {selectedSpecialist && (
                  <button
                    onClick={() => fetchAiSummary(selectedSpecialist)}
                    disabled={aiLoading}
                    className="w-full sm:w-auto px-4 md:px-5 py-2 md:py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm flex-shrink-0">auto_awesome</span>
                    <span>{aiLoading ? t('common.loading', 'Loading...') : t('orgDashboard.ai.analyze', 'Analyze')}</span>
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && !selectedSpecialist && (
                <>
                  <div className="sm:hidden fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute z-20 top-full mt-1 right-0 left-0 sm:left-0 sm:right-auto w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {filteredSpecialists.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                      <span className="material-symbols-outlined text-3xl mb-2 block">person_search</span>
                      {t('orgDashboard.ai.noSpecialists', 'No specialists found')}
                    </div>
                  ) : (
                    filteredSpecialists.map(s => (
                      <button
                        key={s._id}
                        onClick={() => fetchAiSummary(s)}
                        className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                      >
                        <div className="w-8 h-8 md:w-9 md:h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                          {(s.fullName || s.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs md:text-sm truncate">{s.fullName || s.email}</p>
                          <p className="text-[10px] md:text-xs text-slate-400 truncate">{roleLabel(s.role)}{s.email ? ` · ${s.email}` : ''}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 text-lg flex-shrink-0">chevron_right</span>
                      </button>
                    ))
                  )}
                </div>
                </>
              )}
            </div>

            {/* Error */}
            {aiError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl mb-4 text-sm text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-lg">error</span>
                {aiError}
              </div>
            )}

            {/* Loading skeleton */}
            {aiLoading && (
              <div className="space-y-3 md:space-y-4 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 md:h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                  <div className="h-48 md:h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  <div className="h-48 md:h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                </div>
              </div>
            )}

            {/* ─── AI Summary Results ─── */}
            {aiSummary && !aiLoading && (
              <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
                {/* Selected specialist badge */}
                {selectedSpecialist && (
                  <div className="flex items-center gap-2 md:gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-300 dark:border-indigo-800">
                    <div className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
                      {(selectedSpecialist.fullName || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs md:text-sm truncate">{selectedSpecialist.fullName}</p>
                      <p className="text-[10px] md:text-xs text-slate-500 truncate">{roleLabel(selectedSpecialist.role)}</p>
                    </div>
                  </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="relative overflow-hidden p-4 md:p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 border border-indigo-300 dark:border-indigo-700/30 shadow-sm">
                    <span className="material-symbols-outlined absolute -top-1 -right-1 text-4xl md:text-5xl text-indigo-200 dark:text-indigo-800/40">description</span>
                    <p className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">{aiSummary.totalPlans || 0}</p>
                    <p className="text-[10px] md:text-xs font-medium text-indigo-500/80 mt-1">{t('orgDashboard.ai.totalPlans', 'Total Plans')}</p>
                  </div>
                  <div className="relative overflow-hidden p-4 md:p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 border border-emerald-300 dark:border-emerald-700/30 shadow-sm">
                    <span className="material-symbols-outlined absolute -top-1 -right-1 text-4xl md:text-5xl text-emerald-200 dark:text-emerald-800/40">child_care</span>
                    <p className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">{aiSummary.childrenCount || 0}</p>
                    <p className="text-[10px] md:text-xs font-medium text-emerald-500/80 mt-1">{t('orgDashboard.ai.childrenServed', 'Children Served')}</p>
                  </div>
                  <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/20 border border-cyan-300 dark:border-cyan-700/30 shadow-sm">
                    <span className="material-symbols-outlined absolute -top-1 -right-1 text-5xl text-cyan-200 dark:text-cyan-800/40">thumb_up</span>
                    <p className="text-3xl font-black text-cyan-600 dark:text-cyan-400">{aiSummary.approvalRatePercent || 0}<span className="text-lg">%</span></p>
                    <p className="text-xs font-medium text-cyan-500/80 mt-1">{t('orgDashboard.ai.approvalRate', 'Approval Rate')}</p>
                  </div>
                  <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-300 dark:border-purple-700/30 shadow-sm">
                    <span className="material-symbols-outlined absolute -top-1 -right-1 text-5xl text-purple-200 dark:text-purple-800/40">trending_up</span>
                    <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{aiSummary.resultsImprovedRatePercent || 0}<span className="text-lg">%</span></p>
                    <p className="text-xs font-medium text-purple-500/80 mt-1">{t('orgDashboard.ai.improvementRate', 'Improvement Rate')}</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Plan Distribution Donut */}
                  {planChartData.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-300 dark:border-slate-700/30">
                      <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">donut_large</span>
                        {t('orgDashboard.ai.planDistribution', 'Plan Distribution')}
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={planChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {planChartData.map((_, i) => (
                              <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Feedback Breakdown Bar Chart */}
                  {feedbackChartData.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-300 dark:border-slate-700/30">
                      <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
                        {t('orgDashboard.ai.feedbackBreakdown', 'Feedback Breakdown')}
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={feedbackChartData} barSize={40}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {feedbackChartData.map((_, i) => (
                              <Cell key={i} fill={FEEDBACK_COLORS[i % FEEDBACK_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Rate Gauges */}
                {rateData.some(d => d.value > 0) && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-300 dark:border-slate-700/30">
                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">speed</span>
                      {t('orgDashboard.ai.performanceGauges', 'Performance Gauges')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {rateData.map((item) => (
                        <div key={item.name} className="flex flex-col items-center">
                          <ResponsiveContainer width="100%" height={180}>
                            <RadialBarChart
                              cx="50%" cy="50%"
                              innerRadius="60%" outerRadius="90%"
                              startAngle={180} endAngle={0}
                              data={[{ ...item, fill: item.fill }]}
                            >
                              <RadialBar
                                background={{ fill: '#e2e8f0' }}
                                dataKey="value"
                                cornerRadius={10}
                              />
                            </RadialBarChart>
                          </ResponsiveContainer>
                          <div className="text-center -mt-16">
                            <p className="text-2xl font-black" style={{ color: item.fill }}>{item.value}%</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{item.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Feedback Summary */}
                {(aiSummary.totalFeedback != null && aiSummary.totalFeedback > 0) && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-300 dark:border-slate-700/30">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">reviews</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t('orgDashboard.ai.totalFeedback', 'Total Feedback Collected')}</p>
                      <p className="text-2xl font-black">{aiSummary.totalFeedback}</p>
                    </div>
                  </div>
                )}

                {/* AI Insight */}
                {aiSummary.insight && (
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200/50 dark:border-indigo-700/30">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-indigo-500 mt-0.5">auto_awesome</span>
                      <div>
                        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1">{t('orgDashboard.ai.insight', 'AI Insight')}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{aiSummary.insight}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!aiSummary && !aiLoading && !aiError && (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">monitoring</span>
                <p className="text-sm text-slate-400 dark:text-slate-500">{t('orgDashboard.ai.emptyState', 'Search for a specialist above to view their AI-powered progress analytics')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
