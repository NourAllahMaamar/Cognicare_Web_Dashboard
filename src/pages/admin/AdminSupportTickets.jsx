import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';

const TYPE_ICONS = { bug: 'bug_report', suggestion: 'lightbulb', contact: 'mail' };
const STATUS_COLORS = { open: 'warning', in_progress: 'info', resolved: 'success' };
const PRIORITY_COLORS = { low: 'text-slate-400', medium: 'text-amber-500', urgent: 'text-red-500' };

/** Maps any granular care-provider role to the 'careProvider' umbrella key */
const CARE_PROVIDER_ROLES = new Set([
  'careProvider', 'doctor', 'volunteer', 'psychologist',
  'speech_therapist', 'occupational_therapist', 'ergotherapist', 'caregiver',
]);
function normalizeRole(role) {
  return CARE_PROVIDER_ROLES.has(role) ? 'careProvider' : role;
}

export default function AdminSupportTickets() {
  const { t } = useTranslation();
  const { authGet, authMutate } = useAuth('admin');

  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const flash = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3500);
  };

  const fetchTickets = useCallback(async (skipCache = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      if (filterRole) params.set('role', filterRole);
      const data = await authGet(`/support/admin/all?${params}`, skipCache ? { skipCache: true } : undefined);
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      setTotal(data?.total ?? 0);
    } catch (e) {
      flash(setError, e.message);
    } finally {
      setLoading(false);
    }
  }, [authGet, page, filterStatus, filterType, filterRole]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleStatusChange = async (ticketId, status) => {
    try {
      const updated = await authMutate(`/support/${ticketId}/status`, {
        method: 'PATCH',
        body: { status },
      });
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, status: updated.status } : t)),
      );
      if (selectedTicket?._id === ticketId) setSelectedTicket(updated);
      flash(setSuccess, t('support.statusUpdated', 'Status updated'));
    } catch (e) {
      flash(setError, e.message);
    }
  };

  const handleAdminReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const updated = await authMutate(`/support/${selectedTicket._id}/admin-message`, {
        method: 'POST',
        body: { message: replyText },
      });
      setSelectedTicket(updated);
      setReplyText('');
    } catch (e) {
      flash(setError, e.message);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm(t('support.deleteConfirm', 'Are you sure you want to delete this ticket? This cannot be undone.'))) return;
    try {
      await authMutate(`/support/admin/${ticketId}`, { method: 'DELETE' });
      setTickets((prev) => prev.filter((tk) => tk._id !== ticketId));
      setTotal((prev) => prev - 1);
      if (selectedTicket?._id === ticketId) setSelectedTicket(null);
      flash(setSuccess, t('support.deleteSuccess', 'Ticket deleted successfully'));
    } catch (e) {
      flash(setError, e.message);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{t('support.adminTitle', 'Support Tickets')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {total} {t('support.ticketsTotal', 'tickets total')}
          </p>
        </div>
        <button
          onClick={() => fetchTickets(true)}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span className={`material-symbols-outlined text-base${loading ? ' animate-spin' : ''}`}>refresh</span>
          {t('common.refresh', 'Refresh')}
        </button>
      </div>

      {/* Feedback */}
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {success && <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm dark:bg-green-900/20 dark:text-green-400">{success}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => { setPage(1); setFilterStatus(e.target.value); }}
          className="border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t('support.filterAllStatuses', 'All Statuses')}</option>
          <option value="open">{t('support.status.open', 'Open')}</option>
          <option value="in_progress">{t('support.status.in_progress', 'In Progress')}</option>
          <option value="resolved">{t('support.status.resolved', 'Resolved')}</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => { setPage(1); setFilterType(e.target.value); }}
          className="border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t('support.filterAllTypes', 'All Types')}</option>
          <option value="bug">{t('support.type.bug', 'Bug Report')}</option>
          <option value="suggestion">{t('support.type.suggestion', 'Suggestion')}</option>
          <option value="contact">{t('support.type.contact', 'Contact')}</option>
        </select>

        <select
          value={filterRole}
          onChange={(e) => { setPage(1); setFilterRole(e.target.value); }}
          className="border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t('support.filterAllRoles', 'All Roles')}</option>
          <option value="careProvider">{t('support.role.careProvider', 'Specialist')}</option>
          <option value="organization_leader">{t('support.role.organization_leader', 'Org Leader')}</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
          <span className="material-symbols-outlined text-5xl">inbox</span>
          <p className="text-sm">{t('support.noTicketsAdmin', 'No tickets found')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-start">{t('support.col.user', 'User')}</th>
                  <th className="px-4 py-3 text-start">{t('support.col.role', 'Role')}</th>
                  <th className="px-4 py-3 text-start">{t('support.col.subject', 'Subject')}</th>
                  <th className="px-4 py-3 text-start">{t('support.col.type', 'Type')}</th>
                  <th className="px-4 py-3 text-start">{t('support.col.priority', 'Priority')}</th>
                  <th className="px-4 py-3 text-start">{t('support.col.status', 'Status')}</th>
                  <th className="px-4 py-3 text-start">{t('support.col.date', 'Date')}</th>
                  <th className="px-4 py-3 text-start">{t('support.col.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-surface-dark">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{ticket.userId?.fullName || '—'}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{ticket.userId?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {t(`support.role.${normalizeRole(ticket.role)}`, ticket.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{ticket.subject}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <span className="material-symbols-outlined text-base text-slate-400">
                          {TYPE_ICONS[ticket.type] || 'help'}
                        </span>
                        {t(`support.type.${ticket.type}`, ticket.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ticket.priority ? (
                        <span className={`font-medium ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                          {t(`support.priority.${ticket.priority}`, ticket.priority)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={STATUS_COLORS[ticket.status]} label={t(`support.status.${ticket.status}`, ticket.status)} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedTicket(ticket); setNewStatus(ticket.status); }}
                          className="text-primary hover:underline text-xs font-medium"
                        >
                          {t('support.view', 'View')}
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket._id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                          title={t('support.deleteTicket', 'Delete Ticket')}
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                {t('common.prev', 'Prev')}
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                {t('common.next', 'Next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Ticket Detail / Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedTicket.userId?.fullName} &middot; {t(`support.type.${selectedTicket.type}`, selectedTicket.type)}
                </p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Status change */}
            <div className="px-5 pt-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('support.col.status', 'Status')}:</label>
              <select
                value={newStatus}
                onChange={(e) => { setNewStatus(e.target.value); handleStatusChange(selectedTicket._id, e.target.value); }}
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="open">{t('support.status.open', 'Open')}</option>
                <option value="in_progress">{t('support.status.in_progress', 'In Progress')}</option>
                <option value="resolved">{t('support.status.resolved', 'Resolved')}</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-900/30">
              {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">{t('support.noMessages', 'No messages yet')}</p>
              )}
              {selectedTicket.messages?.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === 'admin' ? 'ltr:self-end ltr:items-end rtl:self-start rtl:items-start' : 'ltr:self-start ltr:items-start rtl:self-end rtl:items-end'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.sender === 'admin'
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {msg.sender === 'admin' ? t('support.youAdmin', 'You (Admin)') : (selectedTicket.userId?.fullName || t('support.user', 'User'))} &middot;{' '}
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Attachments */}
            {selectedTicket.attachments?.length > 0 && (
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-2">
                {selectedTicket.attachments.map((url, i) => (
                  url.endsWith('.pdf') || url.includes('/raw/') ? (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg text-primary hover:underline bg-slate-50 dark:bg-slate-800">
                      <span className="material-symbols-outlined text-sm">picture_as_pdf</span> {t('support.pdfAttachment', 'PDF')} {i + 1}
                    </a>
                  ) : (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="h-14 w-14 rounded-lg object-cover border border-slate-200 dark:border-slate-600 hover:opacity-80 transition-opacity" />
                    </a>
                  )
                ))}
              </div>
            )}

            {/* Admin Reply */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminReply()}
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('support.replyPlaceholder', 'Type a message…')}
              />
              <button
                onClick={handleAdminReply}
                disabled={!replyText.trim()}
                className="p-2 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
