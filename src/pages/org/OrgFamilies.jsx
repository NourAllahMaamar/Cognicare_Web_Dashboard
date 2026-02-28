import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';
import * as XLSX from 'xlsx';

export default function OrgFamilies() {
  const { t, i18n } = useTranslation();
  const { authGet, authMutate, authFetch, getUser } = useAuth('orgLeader');

  const [families, setFamilies] = useState([]);
  const [allChildren, setAllChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Family modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('invite');
  const [inviteEmail, setInviteEmail] = useState('');
  const [editingFamily, setEditingFamily] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });

  // Children in form
  const [formChildren, setFormChildren] = useState([]);
  const [existingChildren, setExistingChildren] = useState([]);
  const [childrenToDelete, setChildrenToDelete] = useState([]);

  // Children view modal
  const [viewFamily, setViewFamily] = useState(null);

  // Import/Export
  const [showDropdown, setShowDropdown] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importType, setImportType] = useState('families');
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importMappings, setImportMappings] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState('');
  const fileRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([
        authGet('/organization/my-organization/families').catch(() => []),
        authGet('/organization/my-organization/children').catch(() => []),
      ]);
      setFamilies(Array.isArray(f) ? f : []);
      setAllChildren(Array.isArray(c) ? c : []);
    } catch {}
    setLoading(false);
  };

  const flash = (msg, type = 'success') => {
    if (type === 'error') setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const dateFmt = (d) => d ? new Date(d).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US') : '—';

  // ── Family CRUD ──
  const openAdd = () => {
    setEditingFamily(null);
    setModalMode('invite');
    setInviteEmail('');
    setForm({ fullName: '', email: '', phone: '', password: '' });
    setFormChildren([]);
    setExistingChildren([]);
    setChildrenToDelete([]);
    setShowModal(true);
  };

  const openEdit = (fam) => {
    setEditingFamily(fam);
    setModalMode('edit');
    setForm({ fullName: fam.fullName || '', email: fam.email || '', phone: fam.phone || '', password: '' });
    setExistingChildren(allChildren.filter(c => c.parentId === fam._id || c.familyId === fam._id));
    setFormChildren([]);
    setChildrenToDelete([]);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (modalMode === 'edit' && editingFamily) {
        // 1. Update family
        await authMutate(`/organization/my-organization/families/${editingFamily._id}`, { method: 'PATCH', body: { fullName: form.fullName, email: form.email, phone: form.phone } });
        // 2. Delete marked children
        for (const id of childrenToDelete) {
          await authMutate(`/organization/my-organization/families/${editingFamily._id}/children/${id}`, { method: 'DELETE' }).catch(() => {});
        }
        // 3. Update modified existing children
        for (const c of existingChildren) {
          if (c._modified) {
            await authMutate(`/organization/my-organization/families/${editingFamily._id}/children/${c._id}`, { method: 'PATCH', body: { fullName: c.fullName, dateOfBirth: c.dateOfBirth, gender: c.gender, diagnosis: c.diagnosis, medicalHistory: c.medicalHistory, allergies: c.allergies, medications: c.medications, notes: c.notes } });
          }
        }
        // 4. Create new children
        for (const c of formChildren) {
          if (c.fullName) {
            await authMutate(`/organization/my-organization/families/${editingFamily._id}/children`, { body: { fullName: c.fullName, dateOfBirth: c.dateOfBirth, gender: c.gender, diagnosis: c.diagnosis, medicalHistory: c.medicalHistory, allergies: c.allergies, medications: c.medications, notes: c.notes } });
          }
        }
        flash(t('orgDashboard.familyUpdated', 'Family updated'));
      } else if (modalMode === 'invite') {
        if (!inviteEmail) { flash('Email is required', 'error'); return; }
        await authMutate('/organization/my-organization/families/invite', { body: { email: inviteEmail, role: 'family' } });
        flash(t('orgDashboard.invitationSent', 'Invitation sent'));
      } else {
        if (!form.fullName || !form.email || !form.password) { flash('Name, email, and password are required', 'error'); return; }
        const body = { fullName: form.fullName, email: form.email, phone: form.phone, password: form.password, children: formChildren.filter(c => c.fullName) };
        await authMutate('/organization/my-organization/families/create', { body });
        flash(t('orgDashboard.familyCreated', 'Family created'));
      }
      setShowModal(false);
      loadData();
    } catch (err) { flash(err.message, 'error'); }
  };

  const handleDelete = async (fam) => {
    if (!confirm(t('orgDashboard.confirmDeleteFamily', 'Delete this family?'))) return;
    try {
      await authMutate(`/organization/my-organization/families/${fam._id}`, { method: 'DELETE' });
      flash(t('orgDashboard.familyDeleted', 'Family deleted'));
      loadData();
    } catch (err) { flash(err.message, 'error'); }
  };

  // ── Children helpers ──
  const addNewChild = () => setFormChildren([...formChildren, { fullName: '', dateOfBirth: '', gender: 'male', diagnosis: '', medicalHistory: '', allergies: '', medications: '', notes: '' }]);
  const removeNewChild = (i) => setFormChildren(formChildren.filter((_, idx) => idx !== i));
  const updateNewChild = (i, field, val) => { const nc = [...formChildren]; nc[i] = { ...nc[i], [field]: val }; setFormChildren(nc); };
  const updateExistingChild = (i, field, val) => { const ec = [...existingChildren]; ec[i] = { ...ec[i], [field]: val, _modified: true }; setExistingChildren(ec); };
  const markDeleteChild = (child) => { setChildrenToDelete([...childrenToDelete, child._id]); setExistingChildren(existingChildren.filter(c => c._id !== child._id)); };

  // ── Import/Export ──
  const downloadTemplate = (type) => {
    let headers;
    let filename;
    if (type === 'families_children') {
      headers = ['Parent Name', 'Parent Email', 'Parent Phone', 'Parent Password', 'Child Name', 'DOB', 'Gender', 'Diagnosis', 'Medical History', 'Allergies', 'Medications', 'Notes'];
      filename = 'cognicare_families_children_template.xlsx';
    } else {
      headers = ['Full Name', 'Email', 'Phone', 'Password'];
      filename = 'cognicare_families_template.xlsx';
    }
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
    setShowDropdown(false);
  };

  const exportData = () => {
    const data = families.map(f => ({
      'Full Name': f.fullName, Email: f.email, Phone: f.phone || '',
      'Children Count': f.childrenCount ?? allChildren.filter(c => c.parentId === f._id || c.familyId === f._id).length,
      Joined: dateFmt(f.createdAt)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Families');
    XLSX.writeFile(wb, 'families_export.xlsx');
    setShowDropdown(false);
  };

  const openImport = (type) => {
    setImportType(type);
    setShowImport(true);
    setImportStep(1);
    setImportFile(null);
    setImportPreview(null);
    setImportMappings([]);
    setImportResult(null);
    setDefaultPassword('');
    setShowDropdown(false);
  };

  const handleUploadPreview = async () => {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const orgId = getUser()?.organizationId;
      const importTypePath = importType === 'families_children' ? 'families_children' : 'families';
      const res = await authFetch(`/import/preview/${orgId}/${importTypePath}`, { method: 'POST', body: fd });
      const data = await res.json();
      setImportPreview(data);
      setImportMappings(data.suggestedMappings || []);
      setImportStep(2);
    } catch (err) { flash(err.message, 'error'); }
    setImportLoading(false);
  };

  const handleExecuteImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      fd.append('type', importType);
      fd.append('mappings', JSON.stringify(importMappings));
      if (defaultPassword) fd.append('defaultPassword', defaultPassword);
      const orgId = getUser()?.organizationId;
      const importTypePath = importType === 'families_children' ? 'families_children' : 'families';
      const qp = defaultPassword ? `?defaultPassword=${encodeURIComponent(defaultPassword)}` : '';
      const res = await authFetch(`/import/execute/${orgId}/${importTypePath}${qp}`, { method: 'POST', body: fd });
      const data = await res.json();
      setImportResult(data);
      setImportStep(3);
      loadData();
    } catch (err) { flash(err.message, 'error'); }
    setImportLoading(false);
  };

  const filtered = families.filter(f => {
    const q = search.toLowerCase();
    return !q || (f.fullName || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('orgDashboard.tabs.families', 'Families')}</h2>
          <p className="text-slate-500 dark:text-text-muted mt-1">{families.length} {t('orgDashboard.familiesRegistered', 'families registered')}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="material-symbols-outlined text-lg">import_export</span> {t('common.importExport', 'Import/Export')}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-20">
                <button onClick={exportData} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-xl">Export Families</button>
                <button onClick={() => openImport('families')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Import Families</button>
                <button onClick={() => openImport('families_children')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Import Families + Children</button>
                <button onClick={() => downloadTemplate('families')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Download Template</button>
                <button onClick={() => downloadTemplate('families_children')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-b-xl">Download Families+Children Template</button>
              </div>
            )}
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark">
            <span className="material-symbols-outlined text-lg">add</span> {t('orgDashboard.addFamily', 'Add Family')}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search', 'Search...')} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-4xl mb-2">family_restroom</span>
          <p>{t('orgDashboard.noFamilies', 'No families found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(fam => {
            const famChildren = allChildren.filter(c => c.parentId === fam._id || c.familyId === fam._id);
            return (
              <div key={fam._id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {(fam.fullName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">{fam.fullName}</p>
                      <p className="text-xs text-slate-500">{fam.email}</p>
                    </div>
                  </div>
                  <StatusBadge status="Family" />
                </div>
                <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {fam.phone && <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">phone</span>{fam.phone}</p>}
                  <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">child_care</span>{fam.childrenCount ?? famChildren.length} children</p>
                  <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">calendar_today</span>{dateFmt(fam.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(fam)} className="flex-1 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg">{t('common.edit', 'Edit')}</button>
                  <button onClick={() => setViewFamily(fam)} className="flex-1 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg">Children</button>
                  <button onClick={() => handleDelete(fam)} className="py-2 px-3 text-xs font-bold text-error hover:bg-error/5 rounded-lg">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{modalMode === 'edit' ? t('orgDashboard.editFamily', 'Edit Family') : t('orgDashboard.addFamily', 'Add Family')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
            </div>

            {modalMode !== 'edit' && (
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4">
                <button onClick={() => setModalMode('invite')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${modalMode === 'invite' ? 'bg-white dark:bg-surface-dark shadow-sm' : ''}`}>{t('orgDashboard.invite', 'Invite')}</button>
                <button onClick={() => setModalMode('create')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${modalMode === 'create' ? 'bg-white dark:bg-surface-dark shadow-sm' : ''}`}>{t('orgDashboard.create', 'Create')}</button>
              </div>
            )}

            {modalMode === 'invite' ? (
              <div>
                <label className="block text-sm font-bold mb-1.5">{t('common.email', 'Email')}</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="block text-sm font-bold mb-1.5">{t('common.fullName', 'Full Name')} *</label><input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" /></div>
                  <div><label className="block text-sm font-bold mb-1.5">{t('common.email', 'Email')} *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" /></div>
                  <div><label className="block text-sm font-bold mb-1.5">{t('common.phone', 'Phone')}</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" /></div>
                  {modalMode === 'create' && <div><label className="block text-sm font-bold mb-1.5">{t('common.password', 'Password')} *</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" /></div>}
                </div>

                {/* Children section */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm">{t('orgDashboard.children', 'Children')}</h4>
                    <button onClick={addNewChild} className="text-xs text-primary font-bold hover:underline">+ Add Child</button>
                  </div>

                  {/* Existing children (edit mode) */}
                  {existingChildren.map((c, i) => (
                    <div key={c._id} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <input value={c.fullName || ''} onChange={e => updateExistingChild(i, 'fullName', e.target.value)} placeholder="Name" className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                      <input type="date" value={(c.dateOfBirth || '').split('T')[0]} onChange={e => updateExistingChild(i, 'dateOfBirth', e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                      <select value={c.gender || 'male'} onChange={e => updateExistingChild(i, 'gender', e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                        <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                      </select>
                      <button onClick={() => markDeleteChild(c)} className="p-2 text-error text-xs font-bold hover:bg-error/5 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  ))}

                  {/* New children */}
                  {formChildren.map((c, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-primary/5 rounded-lg">
                      <input value={c.fullName} onChange={e => updateNewChild(i, 'fullName', e.target.value)} placeholder="Name *" className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                      <input type="date" value={c.dateOfBirth} onChange={e => updateNewChild(i, 'dateOfBirth', e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                      <select value={c.gender} onChange={e => updateNewChild(i, 'gender', e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                        <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                      </select>
                      <button onClick={() => removeNewChild(i)} className="p-2 text-error text-xs font-bold hover:bg-error/5 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('common.cancel', 'Cancel')}</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark">{modalMode === 'edit' ? t('common.update', 'Update') : modalMode === 'invite' ? t('orgDashboard.sendInvite', 'Send Invite') : t('common.create', 'Create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Children Modal */}
      {viewFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setViewFamily(null)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Children of {viewFamily.fullName}</h3>
              <button onClick={() => setViewFamily(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
            </div>
            {allChildren.filter(c => c.parentId === viewFamily._id || c.familyId === viewFamily._id).length === 0 ? (
              <p className="text-center text-slate-400 py-8">No children</p>
            ) : (
              <div className="space-y-3">
                {allChildren.filter(c => c.parentId === viewFamily._id || c.familyId === viewFamily._id).map(child => (
                  <div key={child._id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="font-bold text-sm">{child.fullName}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{child.gender}</span>
                      <span>•</span>
                      <span>{dateFmt(child.dateOfBirth)}</span>
                      {child.diagnosis && <><span>•</span><span>{child.diagnosis}</span></>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowImport(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Import {importType === 'families_children' ? 'Families + Children' : 'Families'} — Step {importStep}/3</h3>
              <button onClick={() => setShowImport(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
            </div>

            {importStep === 1 && (
              <div>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center mb-4 cursor-pointer hover:border-primary" onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setImportFile(e.dataTransfer.files[0]); }}>
                  <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">upload_file</span>
                  <p className="text-sm font-medium">{importFile ? importFile.name : 'Drag & drop or click to upload'}</p>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => setImportFile(e.target.files[0])} />
                </div>
                <div><label className="block text-sm font-bold mb-1.5">Default Password</label><input type="password" value={defaultPassword} onChange={e => setDefaultPassword(e.target.value)} placeholder="Optional" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" /></div>
                <button onClick={handleUploadPreview} disabled={!importFile || importLoading} className="mt-4 w-full py-3 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50">{importLoading ? 'Uploading...' : 'Upload & Preview'}</button>
              </div>
            )}

            {importStep === 2 && importPreview && (
              <div>
                <p className="text-sm text-slate-500 mb-4">{importPreview.totalRows} rows found</p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-200 dark:border-slate-800"><th className="text-left p-2 text-xs font-bold text-slate-400">Excel Column</th><th className="text-left p-2 text-xs font-bold text-slate-400">Maps To</th><th className="text-left p-2 text-xs font-bold text-slate-400">Confidence</th></tr></thead>
                    <tbody>
                      {importMappings.map((m, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-2">{m.excelHeader}</td>
                          <td className="p-2"><select value={m.dbField || ''} onChange={e => { const nm = [...importMappings]; nm[i] = { ...m, dbField: e.target.value }; setImportMappings(nm); }} className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"><option value="">Skip</option>{(importPreview.availableFields || []).map(f => <option key={f} value={f}>{f}</option>)}</select></td>
                          <td className="p-2"><span className={`text-xs font-bold ${(m.confidence || 0) > 0.7 ? 'text-success' : 'text-amber-500'}`}>{Math.round((m.confidence || 0) * 100)}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={handleExecuteImport} disabled={importLoading} className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50">{importLoading ? 'Importing...' : 'Execute Import'}</button>
              </div>
            )}

            {importStep === 3 && importResult && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-success/10 rounded-xl text-center"><p className="text-2xl font-black text-success">{importResult.created || 0}</p><p className="text-xs">Created</p></div>
                  <div className="p-4 bg-amber-500/10 rounded-xl text-center"><p className="text-2xl font-black text-amber-500">{importResult.skipped || 0}</p><p className="text-xs">Skipped</p></div>
                  <div className="p-4 bg-error/10 rounded-xl text-center"><p className="text-2xl font-black text-error">{importResult.errors?.length || 0}</p><p className="text-xs">Errors</p></div>
                </div>
                <button onClick={() => setShowImport(false)} className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
