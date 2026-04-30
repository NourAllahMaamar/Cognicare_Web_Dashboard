import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';

const TYPE_ICONS = { bug: 'bug_report', suggestion: 'lightbulb', contact: 'mail' };
const STATUS_COLORS = { open: 'warning', in_progress: 'info', resolved: 'success' };
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_FILES = 5;

const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-colors';
const labelCls = 'text-sm font-semibold text-slate-700 dark:text-slate-300';

export default function OrgSupport() {
  const { t } = useTranslation();
  const { authGet, authMutate, authFetch, getUser } = useAuth('orgLeader');
  const fileInputRef = useRef(null);
  const currentUserName = getUser()?.fullName;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [form, setForm] = useState({ type: 'bug', subject: '', description: '', priority: '' });
  const [files, setFiles] = useState([]);

  const flash = (setter, msg) => { setter(msg); setTimeout(() => setter(''), 3500); };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authGet('/support/my-tickets');
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) { flash(setError, e.message); }
    finally { setLoading(false); }
  }, [authGet]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => ALLOWED_TYPES.includes(f.type));
    const total = files.length + valid.length;
    if (total > MAX_FILES) { flash(setError, t('support.form.maxFiles', `Max ${MAX_FILES} attachments`)); return; }
    setFiles((prev) => [...prev, ...valid.map((f) => ({ file: f, name: f.name, uploading: false, url: null, error: null }))]);
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadFiles = async () => {
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const entry = files[i];
      if (entry.url) { results.push(entry.url); continue; }
      setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, uploading: true, error: null } : f));
      try {
        const fd = new FormData();
        fd.append('file', entry.file);
        const res = await authFetch('/support/upload', { method: 'POST', body: fd });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || t('support.uploadFailed', 'Upload failed')); }
        const { url } = await res.json();
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, uploading: false, url } : f));
        results.push(url);
      } catch (e) {
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, uploading: false, error: e.message } : f));
        throw e;
      }
    }
    return results;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let attachments = [];
      if (files.length > 0) attachments = await uploadFiles();
      await authMutate('/support', { method: 'POST', body: { ...form, priority: form.priority || undefined, attachments } });
      flash(setSuccess, t('support.ticketCreated', 'Ticket submitted successfully'));
      setShowCreate(false);
      setForm({ type: 'bug', subject: '', description: '', priority: '' });
      setFiles([]);
      fetchTickets();
    } catch (e) { flash(setError, e.message); }
    finally { setSubmitting(false); }
  };

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    try {
      const updated = await authMutate(`/support/${ticketId}/message`, { method: 'POST', body: { message: replyText } });
      setSelectedTicket(updated);
      setReplyText('');
    } catch (e) { flash(setError, e.message); }
  };

  const openTicket = async (ticket) => {
    try {
      const data = await authGet(`/support/${ticket._id}`, { skipCache: true });
      setSelectedTicket(data);
    } catch (e) { flash(setError, e.message); }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm(t('support.deleteConfirm', 'Are you sure you want to delete this ticket? This cannot be undone.'))) return;
    try {
      await authMutate(`/support/${ticketId}`, { method: 'DELETE' });
      setTickets((prev) => prev.filter((tk) => tk._id !== ticketId));
      setSelectedTicket(null);
      flash(setSuccess, t('support.deleteSuccess', 'Ticket deleted successfully'));
    } catch (e) { flash(setError, e.message); }
  };

  const closeCreate = () => { setShowCreate(false); setFiles([]); setForm({ type: 'bug', subject: '', description: '', priority: '' }); };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{t('support.title', 'Support')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('support.subtitle', 'Report bugs, send suggestions, or contact admins')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t('support.newTicket', 'New Ticket')}
        </button>
      </div>

      {/* Feedback */}
      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl text-sm">{success}</div>}

      {/* Ticket List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined text-5xl">support_agent</span>
          <p className="text-sm">{t('support.noTickets', 'No tickets yet. Open one if you need help!')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <button
              key={ticket._id}
              onClick={() => openTicket(ticket)}
              className="w-full text-start bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">{TYPE_ICONS[ticket.type] || 'help'}</span>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t(`support.type.${ticket.type}`, ticket.type)} &middot; {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={STATUS_COLORS[ticket.status]} label={t(`support.status.${ticket.status}`, ticket.status)} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('support.newTicket', 'New Ticket')}</h3>
              </div>
              <button onClick={closeCreate} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>{t('support.form.type', 'Type')}</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                    <option value="bug">{t('support.type.bug', 'Bug Report')}</option>
                    <option value="suggestion">{t('support.type.suggestion', 'Suggestion')}</option>
                    <option value="contact">{t('support.type.contact', 'Contact Admin')}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>{t('support.form.priority', 'Priority')} <span className="font-normal text-slate-400">({t('common.optional', 'optional')})</span></label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputCls}>
                    <option value="">{t('support.form.noPriority', '— Select —')}</option>
                    <option value="low">{t('support.priority.low', 'Low')}</option>
                    <option value="medium">{t('support.priority.medium', 'Medium')}</option>
                    <option value="urgent">{t('support.priority.urgent', 'Urgent')}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{t('support.form.subject', 'Subject')}</label>
                <input required maxLength={200} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} placeholder={t('support.form.subjectPlaceholder', 'Brief summary of your issue')} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{t('support.form.description', 'Description')}</label>
                <textarea required rows={4} maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} resize-none`} placeholder={t('support.form.descriptionPlaceholder', 'Describe the issue in detail…')} />
              </div>

              {/* Attachments */}
              <div className="flex flex-col gap-2">
                <label className={labelCls}>
                  {t('support.form.attachments', 'Attachments')} <span className="font-normal text-slate-400">({t('common.optional', 'optional')} — max {MAX_FILES})</span>
                </label>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border ${f.error ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        <span className="material-symbols-outlined text-sm">{f.file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'}</span>
                        <span className="max-w-[120px] truncate">{f.name}</span>
                        {f.uploading && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                        {f.error && <span title={f.error} className="material-symbols-outlined text-sm">error</span>}
                        {!f.uploading && (
                          <button type="button" onClick={() => removeFile(i)} className="ml-0.5 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {files.length < MAX_FILES && (
                  <>
                    <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-primary dark:hover:border-primary hover:text-primary transition-all">
                      <span className="material-symbols-outlined text-lg">attach_file</span>
                      {t('support.form.addAttachment', 'Add image or PDF')}
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeCreate} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark disabled:opacity-60 transition-all">
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {submitting ? t('support.form.submitting', 'Submitting…') : t('support.form.submit', 'Submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Ticket Detail Modal ───────────────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{t(`support.type.${selectedTicket.type}`, selectedTicket.type)}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <StatusBadge status={STATUS_COLORS[selectedTicket.status]} label={t(`support.status.${selectedTicket.status}`, selectedTicket.status)} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDeleteTicket(selectedTicket._id)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  title={t('support.deleteTicket', 'Delete Ticket')}
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

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

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-900/30">
              {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">{t('support.noMessages', 'No messages yet')}</p>
              )}
              {selectedTicket.messages?.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === 'user' ? 'ltr:self-end ltr:items-end rtl:self-start rtl:items-start' : 'ltr:self-start ltr:items-start rtl:self-end rtl:items-end'}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'}`}>
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {msg.sender === 'admin' ? t('support.admin', 'Admin') : (currentUserName || t('support.you', 'You'))} &middot; {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {selectedTicket.status !== 'resolved' ? (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(selectedTicket._id)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  placeholder={t('support.replyPlaceholder', 'Type a message…')}
                />
                <button onClick={() => handleReply(selectedTicket._id)} disabled={!replyText.trim()} className="p-2 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all">
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-surface-dark">
                {t('support.ticketResolved', 'This ticket is resolved')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

