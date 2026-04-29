import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';
import { useTranslation } from 'react-i18next';

export default function AdminFamilies() {
  const { authGet, authMutate } = useAuth('admin');
  const { t } = useTranslation();

  const [families, setFamilies] = useState([]);
  const [allChildren, setAllChildren] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Family modal
  const [showModal, setShowModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [familyForm, setFamilyForm] = useState({ fullName: '', email: '', phone: '', password: '', organizationId: '' });

  // Children modal
  const [showChildren, setShowChildren] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [childForm, setChildForm] = useState({
    fullName: '', dateOfBirth: '', gender: 'male', diagnosis: '',
    medicalHistory: '', allergies: '', medications: '', notes: ''
  });

  // Assign org
  const [showAssignOrg, setShowAssignOrg] = useState(false);
  const [assignFamily, setAssignFamily] = useState(null);
  const [assignOrgId, setAssignOrgId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Helper to match children to families (parentId is populated as object)
  const childBelongsToFamily = (child, familyId) => {
    const pid = typeof child.parentId === 'object' && child.parentId?._id 
      ? child.parentId._id.toString() 
      : child.parentId?.toString();
    const fid = familyId?.toString();
    return pid === fid || child.familyId?.toString() === fid;
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, o, c] = await Promise.all([
        authGet('/organization/admin/families').catch(() => []),
        authGet('/organization/all').catch(() => []),
        authGet('/organization/admin/all-children').catch(() => []),
      ]);
      setFamilies(Array.isArray(f) ? f : []);
      setOrganizations(Array.isArray(o) ? o : []);
      setAllChildren(Array.isArray(c) ? c : []);
    } catch {}
    setLoading(false);
  };

  // â”€â”€ Family CRUD â”€â”€
  const openAddFamily = () => {
    setEditingFamily(null);
    setFamilyForm({ fullName: '', email: '', phone: '', password: '', organizationId: '' });
    setShowModal(true);
  };

  const openEditFamily = (fam) => {
    setEditingFamily(fam);
    setFamilyForm({
      fullName: fam.fullName || '',
      email: fam.email || '',
      phone: fam.phone || '',
      password: '',
      organizationId: fam.organization?._id || fam.organizationId || ''
    });
    setShowModal(true);
  };

  const handleSaveFamily = async () => {
    if (!familyForm.fullName || !familyForm.email) { setError(t('adminFamilies.errorNameEmail')); return; }
    if (!editingFamily && (!familyForm.password || familyForm.password.length < 6)) { setError(t('adminFamilies.errorPassword')); return; }
    try {
      if (editingFamily) {
        const body = { fullName: familyForm.fullName, email: familyForm.email, phone: familyForm.phone };
        await authMutate(`/organization/admin/families/${editingFamily._id}`, { method: 'PATCH', body });
        // Handle org assignment inline
        if (familyForm.organizationId && familyForm.organizationId !== (editingFamily.organization?._id || editingFamily.organizationId || '')) {
          await authMutate(`/organization/admin/families/${editingFamily._id}/organization`, { method: 'PATCH', body: { organizationId: familyForm.organizationId } });
        }
      } else {
        const body = { fullName: familyForm.fullName, email: familyForm.email, phone: familyForm.phone, password: familyForm.password };
        if (familyForm.organizationId) body.organizationId = familyForm.organizationId;
        await authMutate('/organization/admin/families', { body });
      }
      setSuccess(editingFamily ? t('adminFamilies.familyUpdated') : t('adminFamilies.familyCreated'));
      setShowModal(false);
      loadData();
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleDeleteFamily = async (fam) => {
    if (!confirm(t('adminFamilies.confirmDeleteFamily'))) return;
    try {
      await authMutate(`/organization/admin/families/${fam._id}`, { method: 'DELETE' });
      setSuccess(t('adminFamilies.familyDeleted'));
      loadData();
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  // â”€â”€ Assign Org â”€â”€
  const openAssignOrg = (fam) => {
    setAssignFamily(fam);
    setAssignOrgId(fam.organization?._id || fam.organizationId || '');
    setShowAssignOrg(true);
  };

  const handleAssignOrg = async () => {
    if (!assignFamily) return;
    setAssignLoading(true);
    try {
      if (assignOrgId) {
        await authMutate(`/organization/admin/families/${assignFamily._id}/organization`, { method: 'PATCH', body: { organizationId: assignOrgId } });
      } else {
        await authMutate(`/organization/admin/families/${assignFamily._id}/organization`, { method: 'DELETE' });
      }
      setSuccess(t('adminFamilies.orgUpdated'));
      setShowAssignOrg(false);
      loadData();
    } catch (err) { setError(err.message); }
    setAssignLoading(false);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  // â”€â”€ Children CRUD â”€â”€
  const openChildren = async (fam) => {
    setSelectedFamily(fam);
    setShowChildren(true);
    setShowChildForm(false);
    setChildrenLoading(true);
    try {
      const c = await authGet(`/organization/admin/families/${fam._id}/children`);
      setChildren(Array.isArray(c) ? c : []);
    } catch { setChildren([]); }
    setChildrenLoading(false);
  };

  const openAddChild = () => {
    setEditingChild(null);
    setChildForm({ fullName: '', dateOfBirth: '', gender: 'male', diagnosis: '', medicalHistory: '', allergies: '', medications: '', notes: '' });
    setShowChildForm(true);
  };

  const openEditChild = (child) => {
    setEditingChild(child);
    setChildForm({
      fullName: child.fullName || '',
      dateOfBirth: child.dateOfBirth ? child.dateOfBirth.split('T')[0] : '',
      gender: child.gender || 'male',
      diagnosis: child.diagnosis || '',
      medicalHistory: child.medicalHistory || '',
      allergies: child.allergies || '',
      medications: child.medications || '',
      notes: child.notes || ''
    });
    setShowChildForm(true);
  };

  const handleSaveChild = async () => {
    if (!childForm.fullName || !childForm.dateOfBirth || !childForm.gender) { setError(t('adminFamilies.errorChildRequired')); return; }
    try {
      const body = { ...childForm };
      if (editingChild) {
        await authMutate(`/organization/admin/families/${selectedFamily._id}/children/${editingChild._id}`, { method: 'PATCH', body });
      } else {
        await authMutate(`/organization/admin/families/${selectedFamily._id}/children`, { body });
      }
      setSuccess(editingChild ? t('adminFamilies.childUpdated') : t('adminFamilies.childAdded'));
      setShowChildForm(false);
      const c = await authGet(`/organization/admin/families/${selectedFamily._id}/children`);
      setChildren(Array.isArray(c) ? c : []);
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleDeleteChild = async (child) => {
    if (!confirm(t('adminFamilies.confirmDeleteChild'))) return;
    try {
      await authMutate(`/organization/admin/families/${selectedFamily._id}/children/${child._id}`, { method: 'DELETE' });
      setSuccess(t('adminFamilies.childDeleted'));
      const c = await authGet(`/organization/admin/families/${selectedFamily._id}/children`);
      setChildren(Array.isArray(c) ? c : []);
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  // â”€â”€ Filter â”€â”€
  const filtered = families.filter(f => {
    const q = search.toLowerCase();
    return !q || (f.fullName || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{t('adminFamilies.title')}</h2>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{t('adminFamilies.count', { count: families.length })}</p>
        </div>
        <button onClick={openAddFamily} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors">
          <span className="material-symbols-outlined text-lg flex-shrink-0">add</span>
          <span className="hidden sm:inline">{t('adminFamilies.addFamily')}</span>
          <span className="sm:hidden">{t('adminFamilies.addFamily')}</span>
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      {/* Search */}
      <div className="relative w-full md:max-w-md">
        <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg flex-shrink-0">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('adminFamilies.searchPlaceholder')} className="w-full ps-10 pe-4 py-2 md:py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
      </div>

      {/* Families Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-8 md:p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
          <span className="material-symbols-outlined text-4xl mb-2 flex-shrink-0">family_restroom</span>
          <p className="text-sm md:text-base">{t('adminFamilies.noFamiliesFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(fam => (
            <div key={fam._id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {(fam.fullName || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm md:text-base truncate">{fam.fullName}</p>
                    <p className="text-xs md:text-sm text-slate-500 truncate">{fam.email}</p>
                  </div>
                </div>
                <StatusBadge status={t('adminUsers.roleFamily')} />
              </div>

              <div className="space-y-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-3 md:mb-4">
                {fam.phone && <p className="flex items-center gap-2 truncate"><span className="material-symbols-outlined text-sm flex-shrink-0">phone</span><span className="truncate">{fam.phone}</span></p>}
                <p className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-sm flex-shrink-0">corporate_fare</span>
                  <span className="truncate">{fam.organization?.name || fam.organization?.organizationName || t('adminFamilies.noOrganization')}</span>
                </p>
                <p className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-sm flex-shrink-0">child_care</span>
                  <span className="truncate">{t('adminFamilies.childrenCount', { count: allChildren.filter(c => childBelongsToFamily(c, fam._id)).length })}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEditFamily(fam)} className="flex-1 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors">{t('adminFamilies.editBtn')}</button>
                <button onClick={() => openChildren(fam)} className="flex-1 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors">{t('adminFamilies.childrenBtn')}</button>
                <button onClick={() => openAssignOrg(fam)} className="flex-1 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors">{t('adminFamilies.orgBtn')}</button>
                <button onClick={() => handleDeleteFamily(fam)} className="py-2 px-3 text-xs font-bold text-error hover:bg-error/5 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Family Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-bold">{editingFamily ? t('adminFamilies.editFamilyTitle') : t('adminFamilies.addFamilyTitle')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.fullName')}</label>
                <input value={familyForm.fullName} onChange={e => setFamilyForm({...familyForm, fullName: e.target.value})} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.email')}</label>
                <input type="email" value={familyForm.email} onChange={e => setFamilyForm({...familyForm, email: e.target.value})} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.phone')}</label>
                <input value={familyForm.phone} onChange={e => setFamilyForm({...familyForm, phone: e.target.value})} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              </div>
              {!editingFamily && (
                <div>
                  <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.password')}</label>
                  <input type="password" value={familyForm.password} onChange={e => setFamilyForm({...familyForm, password: e.target.value})} placeholder={t('adminFamilies.passwordPlaceholder')} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.organization')}</label>
                <select value={familyForm.organizationId} onChange={e => setFamilyForm({...familyForm, organizationId: e.target.value})} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary">
                  <option value="">{t('adminFamilies.noOrgOption')}</option>
                  {organizations.map(org => <option key={org._id} value={org._id}>{org.name || org.organizationName}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('adminFamilies.cancel')}</button>
              <button onClick={handleSaveFamily} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark">{editingFamily ? t('adminFamilies.update') : t('adminFamilies.create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Org Modal */}
      {showAssignOrg && assignFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAssignOrg(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{t('adminFamilies.assignOrgTitle')}</h3>
              <button onClick={() => setShowAssignOrg(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{t('adminFamilies.familyLabel')} <strong>{assignFamily.fullName}</strong></p>
            <p className="text-sm text-slate-500 mb-4">{t('adminFamilies.currentLabel')} <strong>{assignFamily.organization?.name || assignFamily.organization?.organizationName || t('adminFamilies.noCurrent')}</strong></p>
            <select value={assignOrgId} onChange={e => setAssignOrgId(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary mb-6">
              <option value="">{t('adminFamilies.noOrgRemove')}</option>
              {organizations.map(org => <option key={org._id} value={org._id}>{org.name || org.organizationName}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowAssignOrg(false)} className="flex-1 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('adminFamilies.cancel')}</button>
              <button onClick={handleAssignOrg} disabled={assignLoading} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50">{assignLoading ? t('adminFamilies.saving') : t('adminFamilies.apply')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Children Modal */}
      {showChildren && selectedFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowChildren(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{t('adminFamilies.childrenOfTitle', { name: selectedFamily.fullName })}</h3>
              <button onClick={() => setShowChildren(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
            </div>

            {childrenLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            ) : showChildForm ? (
              /* Child Form */
              <div>
                <h4 className="font-bold mb-4">{editingChild ? t('adminFamilies.editChildTitle') : t('adminFamilies.addChildTitle')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.childFullName')}</label>
                    <input value={childForm.fullName} onChange={e => setChildForm({...childForm, fullName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.dateOfBirth')}</label>
                    <input type="date" value={childForm.dateOfBirth} onChange={e => setChildForm({...childForm, dateOfBirth: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.gender')}</label>
                    <select value={childForm.gender} onChange={e => setChildForm({...childForm, gender: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary">
                      <option value="male">{t('adminFamilies.genderMale')}</option>
                      <option value="female">{t('adminFamilies.genderFemale')}</option>
                      <option value="other">{t('adminFamilies.genderOther')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.diagnosis')}</label>
                    <input value={childForm.diagnosis} onChange={e => setChildForm({...childForm, diagnosis: e.target.value})} placeholder={t('adminFamilies.diagnosisPlaceholder')} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.medicalHistory')}</label>
                    <input value={childForm.medicalHistory} onChange={e => setChildForm({...childForm, medicalHistory: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.allergies')}</label>
                    <input value={childForm.allergies} onChange={e => setChildForm({...childForm, allergies: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.medications')}</label>
                    <input value={childForm.medications} onChange={e => setChildForm({...childForm, medications: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">{t('adminFamilies.notes')}</label>
                    <input value={childForm.notes} onChange={e => setChildForm({...childForm, notes: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowChildForm(false)} className="flex-1 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('adminFamilies.cancel')}</button>
                  <button onClick={handleSaveChild} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark">{editingChild ? t('adminFamilies.update') : t('adminFamilies.addChildBtn')}</button>
                </div>
              </div>
            ) : (
              /* Children List */
              <div>
                <button onClick={openAddChild} className="mb-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark">
                  <span className="material-symbols-outlined text-lg">add</span> {t('adminFamilies.addChildBtn')}
                </button>
                {children.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <span className="material-symbols-outlined text-3xl mb-2">child_care</span>
                    <p>{t('adminFamilies.noChildrenRegistered')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {children.map(child => (
                      <div key={child._id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <div>
                          <p className="font-bold text-sm">{child.fullName}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>{child.gender}</span>
                            <span>•</span>
                            <span>{child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString() : '"”'}</span>
                            {child.diagnosis && <><span>•</span><span>{child.diagnosis}</span></>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEditChild(child)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-primary">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => handleDeleteChild(child)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-error">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


