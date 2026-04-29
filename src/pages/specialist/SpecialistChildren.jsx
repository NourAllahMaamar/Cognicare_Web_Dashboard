import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getTypeColor, dateFmt as fmtDate } from '../../utils/planUtils';

export default function SpecialistChildren() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { authGet, authMutate, authFetch } = useAuth('specialist');

  const [orgChildren, setOrgChildren] = useState([]);
  const [privateChildren, setPrivateChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childPlans, setChildPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  // Add family modal
  const [showModal, setShowModal] = useState(false);
  const [familyForm, setFamilyForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [formChildren, setFormChildren] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { loadChildren(); }, []);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const [orgC, privC] = await Promise.all([
        authGet('/organization/my-organization/children').catch(() => []),
        authGet('/children/specialist/my-children').catch(() => []),
      ]);
      setOrgChildren(Array.isArray(orgC) ? orgC : []);
      setPrivateChildren(Array.isArray(privC) ? privC : []);
    } catch {}
    setLoading(false);
  };

  const selectChild = async (child) => {
    setSelectedChild(child);
    try {
      const data = await authGet(`/specialized-plans/child/${child._id}`);
      setChildPlans(Array.isArray(data) ? data : []);
    } catch { setChildPlans([]); }
  };

  const handleDeletePlan = async (plan) => {
    if (!confirm(t('specialistDashboard.children.confirmDelete'))) return;
    try {
      await authFetch(`/specialized-plans/${plan._id}`, { method: 'DELETE' });
      setSuccess(t('specialistDashboard.messages.planDeleted'));
      if (selectedChild) selectChild(selectedChild);
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const flash = (msg, type = 'success') => {
    if (type === 'error') setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  // â”€â”€ Family CRUD â”€â”€
  const openAddFamily = () => {
    // Set default birth date to 7 years ago (typical age for interventions)
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 7);
    const defaultDateStr = defaultDate.toISOString().split('T')[0];
    
    setFamilyForm({ fullName: '', email: '', phone: '', password: '' });
    setFormChildren([{ fullName: '', dateOfBirth: defaultDateStr, gender: 'male', diagnosis: '', medicalHistory: '', allergies: '', medications: '', notes: '' }]);
    setShowModal(true);
  };

  const addChild = () => {
    // Set default birth date to 7 years ago for new children
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 7);
    const defaultDateStr = defaultDate.toISOString().split('T')[0];
    
    setFormChildren([...formChildren, { fullName: '', dateOfBirth: defaultDateStr, gender: 'male', diagnosis: '', medicalHistory: '', allergies: '', medications: '', notes: '' }]);
  };
  const removeChild = (i) => setFormChildren(formChildren.filter((_, idx) => idx !== i));
  const updateChild = (i, field, val) => { const nc = [...formChildren]; nc[i] = { ...nc[i], [field]: val }; setFormChildren(nc); };

  const handleCreateFamily = async () => {
    if (!familyForm.fullName || !familyForm.email || !familyForm.password) { flash(t('specialistDashboard.messages.nameEmailPasswordRequired'), 'error'); return; }
    
    // Validate children age - must be at least 3 years old
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    for (const child of formChildren) {
      if (child.fullName && child.dateOfBirth) {
        const birthDate = new Date(child.dateOfBirth);
        if (birthDate > threeYearsAgo) {
          flash(t('specialistDashboard.messages.childMustBe3Years', { name: child.fullName }), 'error');
          return;
        }
      }
    }
    
    setFormLoading(true);
    try {
      const body = { ...familyForm, children: formChildren.filter(c => c.fullName) };
      await authMutate('/children/specialist/add-family', { body });
      flash(t('specialistDashboard.messages.familyCreated'));
      setShowModal(false);
      loadChildren();
    } catch (err) { flash(err.message, 'error'); }
    setFormLoading(false);
  };

  const filteredPlans = planFilter === 'all' ? childPlans : childPlans.filter(p => p.type === planFilter);

  const allChildren = [...orgChildren, ...privateChildren];

  const dateFmt = (d) => fmtDate(d, i18n.language);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{t('specialistDashboard.tabs.children', 'Children')}</h2>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{allChildren.length} {t('specialistDashboard.children.total')} ({orgChildren.length} {t('specialistDashboard.children.org')}, {privateChildren.length} {t('specialistDashboard.children.private')})</p>
        </div>
        <button onClick={openAddFamily} className="w-full sm:w-auto flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark">
          <span className="material-symbols-outlined flex-shrink-0 text-lg">add</span> <span className="hidden sm:inline">{t('specialistDashboard.children.addFamily')}</span><span className="sm:hidden">{t('specialistDashboard.children.addFamilyShort')}</span>
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Children List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Org Children */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">{t('specialistDashboard.children.orgChildren')}</h3>
            {loading ? (
              <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            ) : orgChildren.length === 0 ? (
              <p className="text-sm text-slate-400 p-3">{t('specialistDashboard.children.noOrgChildren')}</p>
            ) : (
              <div className="space-y-2">
                {orgChildren.map(child => (
                  <button key={child._id} onClick={() => selectChild(child)} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedChild?._id === child._id ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 hover:shadow'} border`}>
                    <div className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{(child.fullName || '?')[0].toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm md:text-base truncate">{child.fullName}</p>
                      <p className="text-xs md:text-sm text-slate-400 truncate">{child.diagnosis || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Private Children */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">{t('specialistDashboard.children.privatePatients')}</h3>
            {privateChildren.length === 0 ? (
              <p className="text-sm text-slate-400 p-3">{t('specialistDashboard.children.noPrivatePatients')}</p>
            ) : (
              <div className="space-y-2">
                {privateChildren.map(child => (
                  <button key={child._id} onClick={() => selectChild(child)} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedChild?._id === child._id ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 hover:shadow'} border`}>
                    <div className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm">{(child.fullName || '?')[0].toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm md:text-base truncate">{child.fullName}</p>
                      <p className="text-xs md:text-sm text-slate-400 truncate">{child.diagnosis || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Child Detail */}
        <div className="lg:col-span-2">
          {!selectedChild ? (
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3">child_care</span>
              <p className="font-medium">{t('specialistDashboard.children.selectChild')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Child Info */}
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">{(selectedChild.fullName || '?')[0].toUpperCase()}</div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedChild.fullName}</h3>
                    <p className="text-sm text-slate-500">{selectedChild.gender || ''} • {dateFmt(selectedChild.dateOfBirth)}</p>
                    {selectedChild.diagnosis && <p className="text-sm text-primary mt-0.5">{selectedChild.diagnosis}</p>}
                  </div>
                </div>
                {/* Action buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  <button onClick={() => navigate(`/specialist/ai-recommendations/${selectedChild._id}`)} className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>{t('specialistDashboard.children.actions.aiRecs')}
                  </button>
                  <button onClick={() => navigate(`/specialist/pecs/create?childId=${selectedChild._id}`)} className="flex items-center gap-2 p-2.5 bg-blue-500/5 rounded-xl text-xs font-bold text-blue-500 hover:bg-blue-500/10 transition-colors">
                    <span className="material-symbols-outlined text-lg">grid_view</span>{t('specialistDashboard.children.actions.pecs')}
                  </button>
                  <button onClick={() => navigate(`/specialist/teacch/create?childId=${selectedChild._id}`)} className="flex items-center gap-2 p-2.5 bg-purple-500/5 rounded-xl text-xs font-bold text-purple-500 hover:bg-purple-500/10 transition-colors">
                    <span className="material-symbols-outlined text-lg">track_changes</span>{t('specialistDashboard.children.actions.teacch')}
                  </button>
                  <button onClick={() => navigate(`/specialist/skill-tracker?childId=${selectedChild._id}`)} className="flex items-center gap-2 p-2.5 bg-success/5 rounded-xl text-xs font-bold text-success hover:bg-success/10 transition-colors">
                    <span className="material-symbols-outlined text-lg">insights</span>{t('specialistDashboard.children.actions.skills')}
                  </button>
                  <button onClick={() => navigate(`/specialist/activities?childId=${selectedChild._id}`)} className="flex items-center gap-2 p-2.5 bg-amber-500/5 rounded-xl text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition-colors">
                    <span className="material-symbols-outlined text-lg">sports_esports</span>{t('specialistDashboard.children.actions.games')}
                  </button>
                </div>
              </div>

              {/* Plans filter + list */}
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
                {/* Summary stats */}
                {childPlans.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
                    {[
                      { label: 'PECS', count: childPlans.filter(p => p.type === 'PECS').length, color: 'text-blue-500 bg-blue-500/10' },
                      { label: 'TEACCH', count: childPlans.filter(p => p.type === 'TEACCH').length, color: 'text-purple-500 bg-purple-500/10' },
                      { label: 'Skills', count: childPlans.filter(p => p.type === 'SkillTracker').length, color: 'text-success bg-success/10' },
                      { label: 'Activities', count: childPlans.filter(p => p.type === 'Activity').length, color: 'text-amber-500 bg-amber-500/10' },
                    ].map(s => (
                      <div key={s.label} className={`p-3 rounded-xl text-center ${s.color}`}>
                        <p className="text-xl font-black">{s.count}</p>
                        <p className="text-[10px] font-bold">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">{t('specialistDashboard.children.plans.title')} ({childPlans.length})</h4>
                  <div className="flex gap-1">
                    {['all', 'PECS', 'TEACCH', 'SkillTracker', 'Activity'].map(f => (
                      <button key={f} onClick={() => setPlanFilter(f)} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${planFilter === f ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{f === 'all' ? t('specialistDashboard.children.plans.filterAll') : f}</button>
                    ))}
                  </div>
                </div>

                {filteredPlans.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">{t('specialistDashboard.children.plans.empty')}</p>
                ) : (
                  <div className="space-y-3">
                    {filteredPlans.map(plan => {
                      const c = plan.content || {};
                      return (
                        <div key={plan._id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${getTypeColor(plan.type)}`} />
                              <span className="text-xs font-bold uppercase text-slate-400">{plan.type}</span>
                              <span className="text-[10px] text-slate-400">{dateFmt(plan.createdAt)}</span>
                            </div>
                            <button onClick={() => handleDeletePlan(plan)} className="p-1 text-error hover:bg-error/5 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                          </div>
                          <p className="font-bold text-sm mt-1">{plan.title || plan.name || plan.type}</p>

                          {/* PECS progress */}
                          {plan.type === 'PECS' && c.items && (
                            <div className="mt-2 space-y-1.5">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="material-symbols-outlined text-xs">grid_view</span>
                                {t('specialistDashboard.children.pecs.phase')} {c.phase || ''} • {c.items.length} {t('specialistDashboard.children.pecs.cards')}
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {c.items.map((item, idx) => (
                                  <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.mastered ? 'bg-success/10 text-success' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                    {item.label} {item.mastered ? 'ðŸ†' : `${item.pass || 0}/10`}
                                  </span>
                                ))}
                              </div>
                              {c.items.length > 0 && (
                                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(c.items.filter(i => i.mastered).length / c.items.length) * 100}%` }} />
                                </div>
                              )}
                            </div>
                          )}

                          {/* TEACCH progress */}
                          {plan.type === 'TEACCH' && c.goals && (
                            <div className="mt-2 space-y-1.5">
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-success font-bold">{c.goals.filter(g => g.status === 'mastered').length} {t('specialistDashboard.children.teacch.mastered')}</span>
                                <span className="text-amber-500 font-bold">{c.goals.filter(g => g.status === 'in_progress').length} {t('specialistDashboard.children.teacch.inProgress')}</span>
                                <span className="text-slate-400 font-bold">{c.goals.filter(g => g.status === 'not_started').length} {t('specialistDashboard.children.teacch.notStarted')}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                <div className="h-full bg-success transition-all" style={{ width: `${(c.goals.filter(g => g.status === 'mastered').length / c.goals.length) * 100}%` }} />
                                <div className="h-full bg-amber-400 transition-all" style={{ width: `${(c.goals.filter(g => g.status === 'in_progress').length / c.goals.length) * 100}%` }} />
                              </div>
                            </div>
                          )}

                          {/* SkillTracker progress */}
                          {plan.type === 'SkillTracker' && (
                            <div className="mt-2 space-y-1.5">
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-400">{t('specialistDashboard.children.skillTracker.baseline')} {c.baselinePercent || 0}%</span>
                                <span className={`font-bold ${(c.currentPercent || 0) >= (c.targetPercent || 80) ? 'text-success' : 'text-primary'}`}>{t('specialistDashboard.children.skillTracker.current')} {c.currentPercent || 0}%</span>
                                <span className="text-slate-400">{t('specialistDashboard.children.skillTracker.target')} {c.targetPercent || 80}%</span>
                                {c.mastered && <span className="text-success font-bold">{t('specialistDashboard.children.skillTracker.mastered')}</span>}
                              </div>
                              <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="absolute h-full bg-slate-300 dark:bg-slate-600 rounded-full" style={{ width: `${c.baselinePercent || 0}%` }} />
                                <div className={`absolute h-full rounded-full transition-all ${(c.currentPercent || 0) >= (c.targetPercent || 80) ? 'bg-success' : 'bg-primary'}`} style={{ width: `${c.currentPercent || 0}%` }} />
                                <div className="absolute top-0 h-full w-0.5 bg-success/70" style={{ left: `${c.targetPercent || 80}%` }} title={`Target: ${c.targetPercent || 80}%`} />
                              </div>
                            </div>
                          )}

                          {/* Activity info */}
                          {plan.type === 'Activity' && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              {c.priority && (
                                <span className={`px-2 py-0.5 rounded-full font-bold capitalize ${c.priority === 'high' ? 'bg-error/10 text-error' : c.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{t(`specialistDashboard.children.priority.${c.priority}`)}</span>
                              )}
                              {c.dueDate && <span className="text-slate-400">{t('specialistDashboard.children.activity.due')} {dateFmt(c.dueDate)}</span>}
                              {c.materials?.length > 0 && <span className="text-slate-400">{c.materials.length} {t('specialistDashboard.children.activity.materials')}</span>}
                              {c.parentInstructions && <span className="text-primary flex items-center gap-1"><span className="material-symbols-outlined text-xs">family_restroom</span>{t('specialistDashboard.children.activity.hasInstructions')}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Family Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base md:text-lg font-bold">{t('specialistDashboard.children.modal.title')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-3">
              <div><label className="block text-sm font-bold mb-1.5">{t('specialistDashboard.children.modal.parentName')}</label><input value={familyForm.fullName} onChange={e => setFamilyForm({...familyForm, fullName: e.target.value})} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-bold mb-1.5">{t('specialistDashboard.children.modal.email')}</label><input type="email" value={familyForm.email} onChange={e => setFamilyForm({...familyForm, email: e.target.value})} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-bold mb-1.5">{t('specialistDashboard.children.modal.phone')}</label><input value={familyForm.phone} onChange={e => setFamilyForm({...familyForm, phone: e.target.value})} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-bold mb-1.5">{t('specialistDashboard.children.modal.password')}</label><input type="password" value={familyForm.password} onChange={e => setFamilyForm({...familyForm, password: e.target.value})} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" /></div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm">{t('specialistDashboard.children.modal.children')}</h4>
                <button onClick={addChild} className="text-xs text-primary font-bold hover:underline">{t('specialistDashboard.children.modal.addChild')}</button>
              </div>
              {formChildren.map((c, i) => {
                // Calculate max date (3 years ago from today)
                const maxDate = new Date();
                maxDate.setFullYear(maxDate.getFullYear() - 3);
                const maxDateStr = maxDate.toISOString().split('T')[0];
                
                return (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 p-3 bg-primary/5 rounded-lg">
                  <input value={c.fullName} onChange={e => updateChild(i, 'fullName', e.target.value)} placeholder={t('specialistDashboard.children.modal.childName')} className="px-3 md:px-4 py-2 md:py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs" />
                  <input type="date" value={c.dateOfBirth} onChange={e => updateChild(i, 'dateOfBirth', e.target.value)} max={maxDateStr} title={t('specialistDashboard.children.modal.childAgeTip')} className="px-3 md:px-4 py-2 md:py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs" />
                  <select value={c.gender} onChange={e => updateChild(i, 'gender', e.target.value)} className="px-3 md:px-4 py-2 md:py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs">
                    <option value="male">{t('specialistDashboard.children.modal.male')}</option>
                    <option value="female">{t('specialistDashboard.children.modal.female')}</option>
                  </select>
                  <button onClick={() => removeChild(i)} className="p-2 text-error text-xs font-bold hover:bg-error/5 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('specialistDashboard.children.modal.cancel')}</button>
              <button onClick={handleCreateFamily} disabled={formLoading} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50">{formLoading ? t('specialistDashboard.children.modal.creating') : t('specialistDashboard.children.modal.create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


