import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';

export default function OrgInvitations() {
  const { t, i18n } = useTranslation();
  const { authGet, authMutate } = useAuth('orgLeader');
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadInvitations(); }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await authGet('/organization/my-organization/invitations');
      setInvitations(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const dateFmt = (d) => d ? new Date(d).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US') : 'â€”';

  const isExpired = (expiry) => expiry ? new Date(expiry) < new Date() : false;

  const handleCancel = async (inv) => {
    if (!confirm(t('orgDashboard.confirmCancelInvitation', 'Cancel this invitation?'))) return;
    try {
      await authMutate(`/organization/my-organization/invitations/${inv._id}`, { method: 'DELETE' });
      setSuccess(t('orgDashboard.invitationCancelled', 'Invitation cancelled'));
    } catch (err) {
      // If invitation was already cancelled (e.g. by a re-invite), treat as success
      if (err.status === 404) {
        setSuccess(t('orgDashboard.invitationAlreadyCancelled', 'Invitation was already cancelled'));
      } else {
        setError(err.message);
      }
    }
    loadInvitations();
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">{t('orgDashboard.tabs.invitations', 'Invitations')}</h2>
        <p className="text-slate-500 dark:text-text-muted mt-1">{invitations.length} {t('orgDashboard.pendingInvitations', 'pending invitations')}</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : invitations.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
          <span className="material-symbols-outlined text-4xl mb-2">mail</span>
          <p>{t('orgDashboard.noInvitations', 'No pending invitations')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {invitations.map(inv => (
            <div key={inv._id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${inv.invitationType === 'staff' ? 'bg-primary/10 text-primary' : 'bg-purple-500/10 text-purple-500'}`}>
                    <span className="material-symbols-outlined">{inv.invitationType === 'staff' ? 'badge' : 'family_restroom'}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{inv.userEmail || inv.email}</p>
                    {inv.fullName && <p className="text-xs text-slate-500">{inv.fullName}</p>}
                  </div>
                </div>
                <StatusBadge status={inv.invitationType || inv.type || 'staff'} />
              </div>

              <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">schedule</span>Sent: {dateFmt(inv.createdAt || inv.sentAt)}</p>
                {inv.expiresAt && (
                  <p className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${isExpired(inv.expiresAt) ? 'text-error' : ''}`}>{isExpired(inv.expiresAt) ? 'timer_off' : 'timer'}</span>
                    Expires: {dateFmt(inv.expiresAt)}
                    {isExpired(inv.expiresAt) && <span className="text-error text-xs font-bold ml-1">Expired</span>}
                  </p>
                )}
              </div>

              <button onClick={() => handleCancel(inv)} className="w-full py-2 border border-error/20 text-error rounded-lg text-xs font-bold hover:bg-error/5 transition-colors">
                {t('orgDashboard.cancelInvitation', 'Cancel Invitation')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

