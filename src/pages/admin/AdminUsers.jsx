import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';
import { useTranslation } from 'react-i18next';

export default function AdminUsers() {
  const { authGet, authMutate } = useAuth('admin');
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', role: 'family' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authGet('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const body = { ...formData };
        if (!body.password) delete body.password;
        await authMutate(`/users/${editingUser._id}`, { method: 'PATCH', body });
        setSuccess(t('adminUsers.userUpdated'));
      } else {
        await authMutate('/users', { method: 'POST', body: formData });
        setSuccess(t('adminUsers.userCreated'));
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('adminUsers.confirmDelete'))) return;
    try {
      await authMutate(`/users/${id}`, { method: 'DELETE' });
      setSuccess(t('adminUsers.userDeleted'));
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ fullName: user.fullName || '', email: user.email || '', phone: user.phone || '', password: '', role: user.role || 'family' });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', phone: '', password: '', role: 'family' });
  };

  const roles = ['family', 'admin', 'organization_leader', 'psychologist', 'speech_therapist', 'occupational_therapist', 'doctor', 'volunteer', 'other'];

  const roleLabels = { family: t('adminUsers.roleFamily'), admin: t('adminUsers.roleAdmin'), organization_leader: t('adminUsers.roleOrganizationLeader'), psychologist: t('adminUsers.rolePsychologist'), speech_therapist: t('adminUsers.roleSpeechTherapist'), occupational_therapist: t('adminUsers.roleOccupationalTherapist'), doctor: t('adminUsers.roleDoctor'), volunteer: t('adminUsers.roleVolunteer'), other: t('adminUsers.roleOther'), careProvider: t('adminUsers.roleCareProvider') };
  const roleLabel = (role) => roleLabels[role] || role?.replace(/_/g, ' ');

  const filtered = users.filter(u => {
    const matchesSearch = !searchTerm || u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleIcons = { admin: 'shield_person', family: 'family_restroom', organization_leader: 'corporate_fare', psychologist: 'psychology', speech_therapist: 'record_voice_over', occupational_therapist: 'accessibility_new', doctor: 'medical_services', volunteer: 'volunteer_activism', other: 'person' };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('adminUsers.title')}</h2>
          <p className="text-slate-500 dark:text-text-muted mt-1">{users.length} {t('adminUsers.title').toLowerCase()}</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all">
          <span className="material-symbols-outlined text-lg">person_add</span>{t('adminUsers.addUser')}
        </button>
      </div>

      {/* Messages */}
      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('adminUsers.searchPlaceholder')} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary">
          <option value="all">{t('adminUsers.allRoles')}</option>
          {roles.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
          <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
          <p>{t('adminUsers.noUsersFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <div key={u._id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-bold">{u.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-text-muted">{u.email}</p>
                  </div>
                </div>
                <StatusBadge status={u.deletedAt ? t('adminUsers.statusDeleted') : u.isConfirmed ? t('adminUsers.statusActive') : t('adminUsers.statusPending')} />
              </div>

              <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">{roleIcons[u.role] || 'person'}</span>
                  {roleLabel(u.role)}
                </p>
                {u.phone && <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">phone</span>{u.phone}</p>}
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {t('adminUsers.joined')} {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(u)} className="flex-1 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors inline-flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">edit</span> {t('adminUsers.edit')}
                </button>
                <button onClick={() => handleDelete(u._id)} className="py-2 px-3 text-xs font-bold text-error hover:bg-error/5 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editingUser ? t('adminUsers.editUser') : t('adminUsers.addUser')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{t('adminUsers.fullName')}</label>
                <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{t('adminUsers.email')}</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{t('adminUsers.phone')}</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{t('adminUsers.password')} {editingUser && `(${t('adminUsers.passwordHint')})`}</label>
                <input type="password" {...(!editingUser ? { required: true } : {})} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{t('adminUsers.role')}</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary">
                  {roles.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t('adminUsers.cancel')}</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors">{editingUser ? t('adminUsers.saveChanges') : t('adminUsers.createUser')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


