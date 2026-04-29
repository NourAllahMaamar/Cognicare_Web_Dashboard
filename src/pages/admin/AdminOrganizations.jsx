import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';
import { useTranslation } from 'react-i18next';

export default function AdminOrganizations() {
  const { authGet, authMutate } = useAuth('admin');
  const { t } = useTranslation();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgMembers, setOrgMembers] = useState({ staff: [], families: [] });
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteForm, setInviteForm] = useState({ organizationName: '', leaderFullName: '', leaderEmail: '', leaderPhone: '', leaderPassword: '' });
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showChangeLeader, setShowChangeLeader] = useState(null);
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchOrgs(); fetchInvites(); }, []);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const data = await authGet('/organization/all');
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchInvites = async () => {
    try {
      const data = await authGet('/organization/admin/pending-invitations');
      setPendingInvites(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await authMutate('/organization/admin/invite-leader', { body: inviteForm });
      setSuccess(t('adminOrgs.invitedSuccess'));
      setShowInviteModal(false);
      setInviteForm({ organizationName: '', leaderFullName: '', leaderEmail: '', leaderPhone: '', leaderPassword: '' });
      fetchOrgs();
      fetchInvites();
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleDeleteOrg = async (id) => {
    if (!confirm(t('adminOrgs.confirmDelete'))) return;
    try {
      await authMutate(`/organization/${id}`, { method: 'DELETE' });
      setSuccess(t('adminOrgs.deleted'));
      fetchOrgs();
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleCancelInvite = async (id) => {
    try {
      await authMutate(`/organization/admin/invitations/${id}`, { method: 'DELETE' });
      setSuccess(t('adminOrgs.invitationCancelled'));
      fetchInvites();
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleChangeLeader = async (orgId) => {
    if (!newLeaderEmail) return;
    try {
      await authMutate(`/organization/${orgId}/change-leader`, { method: 'PATCH', body: { newLeaderEmail } });
      setSuccess(t('adminOrgs.leaderChanged'));
      setShowChangeLeader(null);
      setNewLeaderEmail('');
      fetchOrgs();
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const viewMembers = async (org) => {
    setSelectedOrg(org);
    setShowMembersModal(true);
    setLoadingMembers(true);
    try {
      const [staff, families] = await Promise.all([
        authGet(`/organization/${org._id}/staff`).catch(() => []),
        authGet(`/organization/${org._id}/families`).catch(() => []),
      ]);
      setOrgMembers({ staff: Array.isArray(staff) ? staff : [], families: Array.isArray(families) ? families : [] });
    } catch {}
    setLoadingMembers(false);
  };

  const filtered = organizations.filter(o => !searchTerm || o.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{t('adminOrgs.title')}</h2>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{t('adminOrgs.count', { count: organizations.length })}</p>
        </div>
        <button onClick={() => setShowInviteModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all">
          <span className="material-symbols-outlined text-lg">add</span>
          <span className="hidden sm:inline">{t('adminOrgs.inviteLeader')}</span>
          <span className="sm:hidden">{t('adminOrgs.inviteLeader')}</span>
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <h3 className="text-sm font-bold text-warning mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">mail</span>
            {t('adminOrgs.pendingInvitations', { count: pendingInvites.length })}
          </h3>
          <div className="space-y-2">
            {pendingInvites.map(inv => (
              <div key={inv._id} className="flex items-center justify-between bg-white dark:bg-surface-dark p-3 rounded-lg border border-slate-300 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium">{inv.organizationName}</p>
                  <p className="text-xs text-slate-500">{inv.leaderEmail}</p>
                </div>
                <button onClick={() => handleCancelInvite(inv._id)} className="text-xs text-error hover:underline font-medium">{t('adminOrgs.cancelInvite')}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative w-full md:max-w-md">
        <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('adminOrgs.searchPlaceholder')} className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
      </div>

      {/* Organizations Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(org => (
            <div key={org._id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">corporate_fare</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{org.name}</p>
                    <p className="text-xs text-slate-500 dark:text-text-muted truncate">{org.leader?.fullName || t('adminOrgs.noLeader')}</p>
                  </div>
                </div>
                <StatusBadge status={org.status || 'Active'} />
              </div>
              <div className="flex gap-4 text-xs text-slate-500 dark:text-text-muted mb-4">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">badge</span>{t('adminOrgs.staffCount', { count: org.staff?.length || 0 })}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">family_restroom</span>{t('adminOrgs.familiesCount', { count: org.families?.length || 0 })}</span>
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button onClick={() => viewMembers(org)} className="text-xs text-primary font-medium hover:underline">{t('adminOrgs.viewMembers')}</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => { setShowChangeLeader(org._id); setNewLeaderEmail(''); }} className="text-xs text-slate-500 font-medium hover:text-primary">{t('adminOrgs.changeLeader')}</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => handleDeleteOrg(org._id)} className="text-xs text-error font-medium hover:underline">{t('adminOrgs.delete')}</button>
              </div>
              {showChangeLeader === org._id && (
                <div className="mt-3 flex gap-2">
                  <input type="email" placeholder={t('adminOrgs.newLeaderEmailPlaceholder')} value={newLeaderEmail} onChange={e => setNewLeaderEmail(e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs" />
                  <button onClick={() => handleChangeLeader(org._id)} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold">{t('adminOrgs.save')}</button>
                  <button onClick={() => setShowChangeLeader(null)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">{t('adminOrgs.cancel')}</button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p>{t('adminOrgs.noOrgsFound')}</p>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-bold">{t('adminOrgs.inviteModal.title')}</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 -mr-1"><span className="material-symbols-outlined text-xl">close</span></button>
            </div>
            <form onSubmit={handleInvite} className="flex flex-col gap-3 md:gap-4">
              {[
              { key: 'organizationName', label: t('adminOrgs.inviteModal.orgName'), type: 'text' },
                { key: 'leaderFullName', label: t('adminOrgs.inviteModal.leaderFullName'), type: 'text' },
                { key: 'leaderEmail', label: t('adminOrgs.inviteModal.leaderEmail'), type: 'email' },
                { key: 'leaderPhone', label: t('adminOrgs.inviteModal.leaderPhone'), type: 'tel' },
                { key: 'leaderPassword', label: t('adminOrgs.inviteModal.tempPassword'), type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{f.label}</label>
                  <input type={f.type} required value={inviteForm[f.key]} onChange={e => setInviteForm({ ...inviteForm, [f.key]: e.target.value })} className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
                </div>
              ))}
              <div className="flex gap-2 md:gap-3 mt-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('adminOrgs.inviteModal.cancel')}</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark">{t('adminOrgs.inviteModal.sendInvitation')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowMembersModal(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-bold truncate pr-2">{selectedOrg.name} - {t('adminOrgs.membersModal.membersSuffix')}</h3>
              <button onClick={() => setShowMembersModal(false)} className="p-1.5 flex-shrink-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined text-xl">close</span></button>
            </div>
            {loadingMembers ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('adminOrgs.membersModal.staff', { count: orgMembers.staff.length })}</h4>
                  {orgMembers.staff.map(s => (
                    <div key={s._id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">{s.fullName?.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium">{s.fullName}</p>
                        <p className="text-xs text-slate-500">{s.role?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  ))}
                  {orgMembers.staff.length === 0 && <p className="text-sm text-slate-400">{t('adminOrgs.membersModal.noStaff')}</p>}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('adminOrgs.membersModal.families', { count: orgMembers.families.length })}</h4>
                  {orgMembers.families.map(f => (
                    <div key={f._id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center text-xs font-bold">{f.fullName?.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium">{f.fullName}</p>
                        <p className="text-xs text-slate-500">{f.email}</p>
                      </div>
                    </div>
                  ))}
                  {orgMembers.families.length === 0 && <p className="text-sm text-slate-400">{t('adminOrgs.membersModal.noFamilies')}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


