import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';
import { API_BASE_URL } from '../../config';
import { exportTemplate, exportJson } from '../../utils/excelExport';

export default function OrgStaff() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { authGet, authMutate, authFetch, getUser } = useAuth('orgLeader');

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('invite'); // invite | create | edit
  const [inviteEmail, setInviteEmail] = useState('');
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', role: 'psychologist', password: '' });

  // Import/Export
  const [showDropdown, setShowDropdown] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importMappings, setImportMappings] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState('');
  const fileRef = useRef(null);

  const roles = ['psychologist', 'speech_therapist', 'occupational_therapist', 'doctor', 'volunteer', 'other'];

  useEffect(() => { loadStaff(); }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await authGet('/organization/my-organization/staff');
      setStaff(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const flash = (msg, type = 'success') => {
    if (type === 'error') setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  // â”€â”€ CRUD â”€â”€
  const openAdd = () => {
    setEditingStaff(null);
    setModalMode('invite');
    setInviteEmail('');
    setForm({ fullName: '', email: '', phone: '', role: 'psychologist', password: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditingStaff(s);
    setModalMode('edit');
    setForm({ fullName: s.fullName || '', email: s.email || '', phone: s.phone || '', role: s.role || 'psychologist', password: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (modalMode === 'edit' && editingStaff) {
        await authMutate(`/organization/my-organization/staff/${editingStaff._id}`, { method: 'PATCH', body: { fullName: form.fullName, email: form.email, phone: form.phone, role: form.role } });
        flash(t('orgDashboard.staffUpdated', 'Staff updated'));
      } else if (modalMode === 'invite') {
        if (!inviteEmail) { flash('Email is required', 'error'); return; }
        await authMutate('/organization/my-organization/staff/invite', { body: { email: inviteEmail, role: 'specialist' } });
        flash(t('orgDashboard.invitationSent', 'Invitation sent'));
      } else {
        if (!form.fullName || !form.email || !form.password) { flash('Name, email, and password are required', 'error'); return; }
        await authMutate('/organization/my-organization/staff/create', { body: { email: form.email, fullName: form.fullName, phone: form.phone, role: form.role, password: form.password } });
        flash(t('orgDashboard.staffCreated', 'Staff created'));
      }
      setShowModal(false);
      loadStaff();
    } catch (err) { flash(err.message, 'error'); }
  };

  const handleDelete = async (s) => {
    if (!confirm(t('orgDashboard.confirmDeleteStaff', 'Delete this staff member?'))) return;
    try {
      await authMutate(`/organization/my-organization/staff/${s._id}`, { method: 'DELETE' });
      flash(t('orgDashboard.staffDeleted', 'Staff deleted'));
      loadStaff();
    } catch (err) { flash(err.message, 'error'); }
  };

  // â”€â”€ Import/Export â”€â”€
  const downloadTemplate = async () => {
    await exportTemplate(['Full Name', 'Email', 'Phone', 'Role', 'Password'], 'Staff', 'cognicare_staff_template.xlsx');
    setShowDropdown(false);
  };

  const exportStaff = async () => {
    const data = staff.map(s => ({ 'Full Name': s.fullName, Email: s.email, Phone: s.phone || '', Role: s.role, Joined: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '' }));
    await exportJson(data, 'Staff', 'staff_export.xlsx');
    setShowDropdown(false);
  };

  const openImport = () => {
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
      const res = await authFetch(`/import/preview/${orgId}/staff`, { method: 'POST', body: fd });
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
      fd.append('type', 'staff');
      fd.append('mappings', JSON.stringify(importMappings));
      if (defaultPassword) fd.append('defaultPassword', defaultPassword);
      const orgId = getUser()?.organizationId;
      const qp = defaultPassword ? `?defaultPassword=${encodeURIComponent(defaultPassword)}` : '';
      const res = await authFetch(`/import/execute/${orgId}/staff${qp}`, { method: 'POST', body: fd });
      const data = await res.json();
      setImportResult(data);
      setImportStep(3);
      loadStaff();
    } catch (err) { flash(err.message, 'error'); }
    setImportLoading(false);
  };

  const filtered = staff.filter(s => {
    const q = search.toLowerCase();
    return !q || (s.fullName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.role || '').toLowerCase().includes(q);
  });

  const dateFmt = (d) => d ? new Date(d).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US') : '"”';

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header - Responsive stacking */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{t('orgDashboard.tabs.staff', 'Staff Management')}</h2>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{staff.length} {t('orgDashboard.staffMembers', 'staff members')}</p>
        </div>
        {/* Buttons - stack vertically on mobile, horizontal on tablet+ */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Import/Export Dropdown */}
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-lg">import_export</span>
              <span className="hidden sm:inline">{t('orgDashboard.staff.importExport')}</span>
              <span className="sm:hidden">{t('orgDashboard.staff.importExport')}</span>
            </button>
            {showDropdown && (
              <>
                {/* Backdrop for mobile */}
                <div className="sm:hidden fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 sm:w-48 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 shadow-xl z-20">
                  <button onClick={exportStaff} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-xl">{t('orgDashboard.staff.exportStaff')}</button>
                  <button onClick={openImport} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('orgDashboard.staff.importStaff')}</button>
                  <button onClick={downloadTemplate} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-b-xl">{t('orgDashboard.staff.downloadTemplate')}</button>
                </div>
              </>
            )}
          </div>
          <button onClick={openAdd} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            <span className="hidden sm:inline">{t('orgDashboard.staff.addStaff')}</span>
            <span className="sm:hidden">{t('orgDashboard.staff.addStaff')}</span>
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      {/* Search */}
      <div className="relative w-full md:max-w-md">
        <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search', 'Search...')} className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-8 md:p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
          <span className="material-symbols-outlined text-4xl mb-2">groups</span>
          <p className="text-sm md:text-base">{t('orgDashboard.noStaff', 'No staff members found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(s => (
            <div key={s._id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/org/dashboard/specialist/${s._id}`)}>
              {/* Header - More compact on mobile */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base md:text-lg">
                    {(s.fullName || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm md:text-base truncate">{s.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{s.email}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge status={s.role || 'staff'} />
                </div>
              </div>
              
              {/* Info - Hide phone on mobile if too long */}
              <div className="space-y-1.5 text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-3 md:mb-4">
                {s.phone && (
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm flex-shrink-0">phone</span>
                    <span className="truncate">{s.phone}</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm flex-shrink-0">calendar_today</span>
                  <span>{dateFmt(s.createdAt)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm flex-shrink-0 ${s.isConfirmed ? 'text-success' : 'text-amber-500'}`}>
                    {s.isConfirmed ? 'verified' : 'pending'}
                  </span>
                  <span>{s.isConfirmed ? t('common.confirmed', 'Confirmed') : t('common.pending', 'Pending')}</span>
                </p>
              </div>
              
              {/* Actions - More compact on mobile */}
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(s)} className="flex-1 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  {t('common.edit', 'Edit')}
                </button>
                <button onClick={() => handleDelete(s)} className="py-2 px-3 text-xs font-bold text-error hover:bg-error/5 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-base md:text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal - Mobile optimized */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-bold">{modalMode === 'edit' ? t('orgDashboard.editStaff', 'Edit Staff') : t('orgDashboard.addStaff', 'Add Staff')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 -mr-1">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {modalMode !== 'edit' && (
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4">
                <button onClick={() => setModalMode('invite')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${modalMode === 'invite' ? 'bg-white dark:bg-surface-dark shadow-sm' : ''}`}>
                  {t('orgDashboard.invite', 'Invite')}
                </button>
                <button onClick={() => setModalMode('create')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${modalMode === 'create' ? 'bg-white dark:bg-surface-dark shadow-sm' : ''}`}>
                  {t('orgDashboard.create', 'Create')}
                </button>
              </div>
            )}

            {modalMode === 'invite' ? (
              <div>
                <label className="block text-sm font-bold mb-1.5">{t('common.email', 'Email')}</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@email.com" className="w-full p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5">{t('common.fullName', 'Full Name')} *</label>
                  <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">{t('common.email', 'Email')} *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">{t('common.phone', 'Phone')}</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">{t('common.role', 'Role')}</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary">
                    {roles.map(r => <option key={r} value={r}>{t(`roles.${r}`, r)}</option>)}
                  </select>
                </div>
                {modalMode === 'create' && (
                  <div>
                    <label className="block text-sm font-bold mb-1.5">{t('common.password', 'Password')} *</label>
                    <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 characters" className="w-full p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 md:py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                {t('common.cancel', 'Cancel')}
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 md:py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark">
                {modalMode === 'edit' ? t('common.update', 'Update') : modalMode === 'invite' ? t('orgDashboard.sendInvite', 'Send Invite') : t('common.create', 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal - Mobile optimized */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowImport(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-bold">{t('orgDashboard.staff.importModal.title', { step: importStep, total: 3 })}</h3>
              <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 -mr-1"><span className="material-symbols-outlined text-xl">close</span></button>
            </div>

            {importStep === 1 && (
              <div>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 md:p-8 text-center mb-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); setImportFile(e.dataTransfer.files[0]); }}>
                  <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">upload_file</span>
                  <p className="text-xs md:text-sm font-medium break-words">{importFile ? importFile.name : t('orgDashboard.staff.importModal.dragDrop')}</p>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => setImportFile(e.target.files[0])} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">{t('orgDashboard.staff.importModal.defaultPassword')}</label>
                  <input type="password" value={defaultPassword} onChange={e => setDefaultPassword(e.target.value)} placeholder={t('orgDashboard.staff.importModal.defaultPasswordPlaceholder')} className="w-full p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <button onClick={handleUploadPreview} disabled={!importFile || importLoading} className="mt-4 w-full py-2.5 md:py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50">{importLoading ? t('orgDashboard.staff.importModal.importing') : t('orgDashboard.staff.importModal.uploadPreview')}</button>
              </div>
            )}

            {importStep === 2 && importPreview && (
              <div>
                <p className="text-sm text-slate-500 mb-4">{importPreview.totalRows} rows found. Review column mappings:</p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-200 dark:border-slate-800"><th className="text-left p-2 text-xs font-bold text-slate-400">{t('orgDashboard.staff.importModal.excelColumn')}</th><th className="text-left p-2 text-xs font-bold text-slate-400">{t('orgDashboard.staff.importModal.mapsTo')}</th><th className="text-left p-2 text-xs font-bold text-slate-400">{t('orgDashboard.staff.importModal.confidence')}</th><th className="text-left p-2 text-xs font-bold text-slate-400">{t('orgDashboard.staff.importModal.sample')}</th></tr></thead>
                    <tbody>
                      {importMappings.map((m, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-2 font-medium">{m.excelHeader}</td>
                          <td className="p-2">
                            <select value={m.dbField || ''} onChange={e => { const nm = [...importMappings]; nm[i] = { ...m, dbField: e.target.value }; setImportMappings(nm); }} className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs">
                              <option value="">Skip</option>
                              {(importPreview.availableFields || []).map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                          </td>
                          <td className="p-2"><span className={`text-xs font-bold ${(m.confidence || 0) > 0.7 ? 'text-success' : 'text-amber-500'}`}>{Math.round((m.confidence || 0) * 100)}%</span></td>
                          <td className="p-2 text-xs text-slate-400">{importPreview.sampleRows?.[0]?.[m.excelHeader] || '"”'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={handleExecuteImport} disabled={importLoading} className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50">{importLoading ? t('orgDashboard.staff.importModal.importing') : t('orgDashboard.staff.importModal.executeImport')}</button>
              </div>
            )}

            {importStep === 3 && importResult && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-success/10 rounded-xl text-center"><p className="text-2xl font-black text-success">{importResult.created || 0}</p><p className="text-xs text-slate-500">{t('orgDashboard.staff.importModal.created')}</p></div>
                  <div className="p-4 bg-amber-500/10 rounded-xl text-center"><p className="text-2xl font-black text-amber-500">{importResult.skipped || 0}</p><p className="text-xs text-slate-500">{t('orgDashboard.staff.importModal.skipped')}</p></div>
                  <div className="p-4 bg-error/10 rounded-xl text-center"><p className="text-2xl font-black text-error">{importResult.errors?.length || 0}</p><p className="text-xs text-slate-500">{t('orgDashboard.staff.importModal.errors')}</p></div>
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-error">Row {err.row}: {err.field} "” {err.message}</p>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowImport(false)} className="mt-4 w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark">{t('orgDashboard.staff.importModal.done')}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


