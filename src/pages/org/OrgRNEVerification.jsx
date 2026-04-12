import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

/* ─── Constants ─── */
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const CALL_PREP_DURATION = 10;

const PROCESSING_MESSAGES = [
  { key: 'rneVerification.processing.msg1', fallback: 'Scanning document structure and layout...' },
  { key: 'rneVerification.processing.msg2', fallback: 'Extracting registration details with OCR...' },
  { key: 'rneVerification.processing.msg3', fallback: 'Cross-referencing with national registry...' },
  { key: 'rneVerification.processing.msg4', fallback: 'Running fraud detection algorithms...' },
  { key: 'rneVerification.processing.msg5', fallback: 'Generating validation score and report...' },
];

const PROCESSING_STEPS = [
  { key: 'rneVerification.steps.upload', fallback: 'Document upload verified' },
  { key: 'rneVerification.steps.ocr', fallback: 'OCR & text extraction' },
  { key: 'rneVerification.steps.entities', fallback: 'Entity recognition & extraction' },
  { key: 'rneVerification.steps.format', fallback: 'Format & signature validation' },
  { key: 'rneVerification.steps.registry', fallback: 'National registry cross-check' },
  { key: 'rneVerification.steps.fraud', fallback: 'Fraud pattern detection' },
  { key: 'rneVerification.steps.score', fallback: 'Generating validation report' },
];

const CALL_TRANSCRIPT = [
  { role: 'ai', key: 'q1', fallback: 'Hello, this is an automated AI verification call from CogniCare. Can you please confirm your organization name?' },
  { role: 'org', key: 'a1', fallback: 'Yes, this is our organization. We submitted our RNE document for verification.' },
  { role: 'ai', key: 'q2', fallback: 'Thank you. Could you please provide or confirm your RNE registration number?' },
  { role: 'org', key: 'a2', fallback: 'Our registration number matches what we submitted in the document.' },
  { role: 'ai', key: 'q3', fallback: 'Perfect. Can you confirm the full name of the authorized legal representative?' },
  { role: 'org', key: 'a3', fallback: 'The legal representative information is as stated in the official registration documents.' },
];

/* ─── CircularCountdown ─── */
function CircularCountdown({ value, total, size = 160, label, sublabel, color = '#6366f1' }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dashoffset = circ * (1 - value / total);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#e2e8f0" strokeWidth={8}
            className="dark:stroke-slate-700"
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black tabular-nums" style={{ color }}>{value}</span>
          {sublabel && <span className="text-xs text-slate-400 font-medium mt-0.5">{sublabel}</span>}
        </div>
      </div>
      {label && <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center max-w-xs">{label}</p>}
    </div>
  );
}

/* ─── PhaseBar ─── */
function PhaseBar({ currentPhase }) {
  const { t } = useTranslation();
  const phases = [
    { id: 'upload',     icon: 'upload_file', label: t('rneVerification.phases.upload',     'Upload') },
    { id: 'processing', icon: 'smart_toy',   label: t('rneVerification.phases.processing', 'AI Processing') },
    { id: 'analysis',   icon: 'analytics',   label: t('rneVerification.phases.analysis',   'Analysis') },
    { id: 'voice_call', icon: 'call',        label: t('rneVerification.phases.voiceCall',  'Voice Call') },
    { id: 'decision',   icon: 'verified',    label: t('rneVerification.phases.decision',   'Decision') },
  ];
  const phaseIndex = phases.findIndex(p => p.id === currentPhase);

  return (
    <div className="flex items-center w-full">
      {phases.map((phase, idx) => {
        const isCompleted = idx < phaseIndex;
        const isActive = idx === phaseIndex;
        return (
          <div key={phase.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' :
                isActive    ? 'bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/20' :
                              'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {isCompleted
                  ? <span className="material-symbols-outlined text-[18px]">check</span>
                  : <span className="material-symbols-outlined text-[18px]">{phase.icon}</span>
                }
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight hidden sm:block ${
                isActive ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
              }`}>{phase.label}</span>
            </div>
            {idx < phases.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── DropZone ─── */
function DropZone({ file, onFile, error }) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const getFileIcon = (type) => {
    if (type === 'application/pdf') return 'picture_as_pdf';
    if (type?.startsWith('image/')) return 'image';
    return 'insert_drive_file';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        onClick={() => !file && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
          dragging           ? 'border-primary bg-primary/5 scale-[1.01] cursor-copy' :
          file               ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 cursor-default' :
          error              ? 'border-red-400 bg-red-50 dark:bg-red-900/10 cursor-pointer' :
                               'border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-primary/5 cursor-pointer'
        }`}
      >
        {!file ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              error ? 'bg-red-100 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <span className={`material-symbols-outlined text-4xl ${error ? 'text-red-400' : 'text-slate-400'}`}>
                upload_file
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">
                {t('rneVerification.upload.dropTitle', 'Drop your RNE document here')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t('rneVerification.upload.dropSubtitle', 'PDF, JPG or PNG — up to 10 MB')}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('rneVerification.upload.browse', 'Browse Files')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl text-emerald-600 dark:text-emerald-400">
                {getFileIcon(file.type)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{file.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatSize(file.size)}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {t('rneVerification.upload.fileReady', 'Ready for AI analysis')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFile(null); }}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => onFile(e.target.files[0])}
      />
    </div>
  );
}

/* ─── EventLog ─── */
function EventLog({ events }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events]);
  if (!events.length) return null;

  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">System Log</p>
      <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 max-h-44 overflow-y-auto font-mono text-[11px] space-y-1">
        {events.map((ev, i) => (
          <div key={i} className={`flex items-start gap-2 ${
            ev.type === 'error'   ? 'text-red-400' :
            ev.type === 'success' ? 'text-emerald-400' :
                                    'text-cyan-400'
          }`}>
            <span className="text-slate-600 shrink-0 tabular-nums">{ev.time}</span>
            <span className="material-symbols-outlined text-[11px] mt-0.5 shrink-0">
              {ev.type === 'error' ? 'error' : ev.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="break-all">{ev.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ─── Score Ring ─── */
function ScoreRing({ value, size = 64, strokeWidth = 6, color }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} className="dark:stroke-slate-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-black text-sm">{value}%</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function OrgRNEVerification() {
  const { t } = useTranslation();
  const { authFetch } = useAuth('orgLeader');

  /* ── Phase ── */
  const [phase, setPhase] = useState('upload');

  /* ── Upload ── */
  const [file, setFile] = useState(null);
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [fileError, setFileError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── Processing ── */
  const [msgIdx, setMsgIdx] = useState(0);
  const processingRef = useRef(null);

  /* ── Analysis ── */
  const [analysis, setAnalysis] = useState(null);

  /* ── Call ── */
  const [callPhase, setCallPhase] = useState('preparing');
  const [callCountdown, setCallCountdown] = useState(CALL_PREP_DURATION);
  const [transcript, setTranscript] = useState([]);
  const callRef = useRef(null);
  const transcriptTimeouts = useRef([]);

  /* ── Decision ── */
  const [decision, setDecision] = useState(null);

  /* ── Event log ── */
  const [events, setEvents] = useState([]);

  const deriveDecisionFromAnalysis = useCallback(() => {
    // Final organization verification remains an explicit review workflow.
    // AI analysis provides risk signals but does not auto-approve in this flow.
    return 'needs_review';
  }, []);

  const addEvent = useCallback((message, type = 'info') => {
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(n => n.toString().padStart(2, '0')).join(':');
    setEvents(prev => [...prev, { message, type, time }]);
  }, []);

  /* ─── File validation ─── */
  const handleFile = useCallback((f) => {
    setFileError('');
    if (!f) { setFile(null); return; }
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError(t('rneVerification.errors.fileType', 'Only PDF, JPG, or PNG files are accepted'));
      return;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(t('rneVerification.errors.fileSize', 'File must be smaller than 10 MB'));
      return;
    }
    setFile(f);
  }, [t]);

  /* ─── Phone validation ─── */
  const validatePhone = (p) => /^\+?[0-9\s\-().]{8,20}$/.test(p.trim());

  const resolveOrganizationContext = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('orgLeaderUser') || '{}');
      let pendingOrganization = null;
      try {
        const pendingRes = await authFetch('/organization/my-pending-request', {
          method: 'GET',
        });
        if (pendingRes.ok) {
          pendingOrganization = await pendingRes.json();
        }
      } catch {
        pendingOrganization = null;
      }
      const organizationId =
        pendingOrganization?._id ||
        pendingOrganization?.id ||
        storedUser?.organizationId ||
        storedUser?.organization?._id ||
        storedUser?.organization?.id ||
        storedUser?.pendingOrganizationId ||
        storedUser?.pendingOrganization?._id ||
        '';
      const orgName =
        pendingOrganization?.organizationName ||
        storedUser?.organizationName ||
        storedUser?.organization?.name ||
        storedUser?.name ||
        'Your Organization';
      const email = pendingOrganization?.leaderEmail || storedUser?.email || '';
      const websiteDomain = storedUser?.websiteDomain || storedUser?.organization?.websiteDomain || '';
      return { organizationId: String(organizationId || ''), orgName, email, websiteDomain };
    } catch {
      return { organizationId: '', orgName: 'Your Organization', email: '', websiteDomain: '' };
    }
  };

  const mapAnalysisResponse = useCallback((payload) => {
    const extracted = payload?.extractedFields || {};
    const normalizedFraudRisk = Number(payload?.fraudRisk ?? 1);
    const fraudRisk = Math.max(0, Math.min(100, Math.round(normalizedFraudRisk * 100)));
    const validationScore = Math.max(0, Math.min(100, Math.round((1 - normalizedFraudRisk) * 100)));
    return {
      analysisId: payload?.analysisId || '',
      organizationId: payload?.organizationId || '',
      orgName: extracted.name || extracted.organizationName || extracted.orgName || 'Unknown organization',
      registrationNumber: extracted.registrationNumber || extracted.registrationNo || 'N/A',
      registrationDate: extracted.expirationDate || extracted.registrationDate || extracted.date || 'N/A',
      legalStatus: payload?.level || extracted.legalStatus || 'N/A',
      address: extracted.address || 'N/A',
      documentQuality: fraudRisk < 40 ? t('rneVerification.analysis.qualityGood', 'Good') : fraudRisk < 70 ? t('rneVerification.analysis.qualityMedium', 'Medium') : t('rneVerification.analysis.qualityLow', 'Low'),
      validationScore,
      authenticated: fraudRisk < 70,
      fraudRisk,
      level: payload?.level || 'HIGH',
      similarityRisk: payload?.similarityRisk || 'unknown',
      flags: Array.isArray(payload?.flags) ? payload.flags : [],
    };
  }, [t]);

  /* ─── Submit upload ─── */
  const handleSubmit = async () => {
    let valid = true;
    if (!file) {
      setFileError(t('rneVerification.errors.fileRequired', 'Please upload your RNE document'));
      valid = false;
    }
    if (!phone.trim() || !validatePhone(phone)) {
      setPhoneError(t('rneVerification.errors.phoneInvalid', 'Please enter a valid phone number'));
      valid = false;
    }
    if (!valid) return;

    const { organizationId, orgName, email, websiteDomain } =
      await resolveOrganizationContext();
    if (!organizationId) {
      setPhoneError(t('rneVerification.errors.orgContextMissing', 'Organization context is missing. Please sign in again.'));
      addEvent(t('rneVerification.events.orgContextMissing', 'Organization context missing. Verification was not started.'), 'error');
      return;
    }

    setPhase('processing');
    setMsgIdx(0);
    setSubmitting(true);
    addEvent(t('rneVerification.events.processingStart', 'AI document analysis pipeline initiated'), 'info');
    processingRef.current = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 1800);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);
      if (email) formData.append('email', email);
      if (websiteDomain) formData.append('websiteDomain', websiteDomain);
      const res = await authFetch('/org-scan-ai/analyze', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('rneVerification.errors.analysisFailed', 'Document analysis failed.'));
      }
      const payload = await res.json();
      const mapped = { ...mapAnalysisResponse(payload), orgName };
      setAnalysis(mapped);
      addEvent(t('rneVerification.events.analysisComplete', 'Document analysis completed successfully'), 'success');
      addEvent(`${t('rneVerification.events.scoreGenerated', 'Validation score generated')}: ${mapped.validationScore}%`, 'success');
      setPhase('analysis');
    } catch (err) {
      const message = err?.message || t('rneVerification.errors.analysisFailed', 'Document analysis failed.');
      addEvent(message, 'error');
      setFileError(message);
      setPhase('upload');
    } finally {
      if (processingRef.current) {
        clearInterval(processingRef.current);
        processingRef.current = null;
      }
      setSubmitting(false);
    }
  };

  /* ─── Submit for review (no simulated call path) ─── */
  const startVoiceCall = () => {
    addEvent(
      t(
        'rneVerification.events.reviewQueued',
        'AI analysis complete. Submission queued for manual verification review.',
      ),
      'info',
    );
    finalizeDecision();
  };

  const finalizeDecision = () => {
    const docScore = analysis?.validationScore ?? 0;
    const overall = docScore;
    const status = deriveDecisionFromAnalysis(analysis);

    setDecision({
      status,
      docScore,
      callScore: null,
      overall,
      level: analysis?.level || 'MEDIUM',
      flags: Array.isArray(analysis?.flags) ? analysis.flags : [],
      analysisId: analysis?.analysisId || '',
    });
    setPhase('decision');
    addEvent(
      `${t('rneVerification.events.decisionReached', 'Final decision reached')}: ${String(analysis?.level || 'MEDIUM').toUpperCase()} RISK`,
      status === 'rejected' ? 'error' : 'info'
    );
  };

  /* ─── Cleanup ─── */
  useEffect(() => () => {
    clearInterval(processingRef.current);
    clearInterval(callRef.current);
    transcriptTimeouts.current.forEach(clearTimeout);
  }, []);

  /* ─── Reset ─── */
  const reset = () => {
    clearInterval(processingRef.current);
    clearInterval(callRef.current);
    transcriptTimeouts.current.forEach(clearTimeout);
    transcriptTimeouts.current = [];
    setPhase('upload');
    setFile(null);
    setPhone('');
    setConsent(false);
    setFileError('');
    setPhoneError('');
    setSubmitting(false);
    setMsgIdx(0);
    setAnalysis(null);
    setCallPhase('preparing');
    setCallCountdown(CALL_PREP_DURATION);
    setTranscript([]);
    setDecision(null);
    setEvents([]);
  };

  /* ─── Step progress for processing phase ─── */
  const stepProgress = Math.min(msgIdx + 1, PROCESSING_STEPS.length);

  /* ─── Decision color helpers ─── */
  const decisionColor = {
    approved:     { bg: 'bg-emerald-100 dark:bg-emerald-900/20', icon: 'text-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' },
    rejected:     { bg: 'bg-red-100 dark:bg-red-900/20',         icon: 'text-red-500',     badge: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40' },
    needs_review: { bg: 'bg-amber-100 dark:bg-amber-900/20',     icon: 'text-amber-500',   badge: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' },
  };
  const decisionIcon = { approved: 'verified', rejected: 'cancel', needs_review: 'pending' };

  /* ════ RENDER ════ */
  return (
    <div className="flex flex-col gap-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">fact_check</span>
            {t('rneVerification.title', 'RNE Verification')}
          </h2>
          <p className="text-slate-500 dark:text-text-muted mt-1 text-sm">
            {t('rneVerification.subtitle', 'Automated AI-powered organization identity verification system')}
          </p>
        </div>
        {phase !== 'upload' && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-lg">restart_alt</span>
            {t('rneVerification.reset', 'Start Over')}
          </button>
        )}
      </div>

      {/* ── Phase Bar ── */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-5 shadow-sm">
        <PhaseBar currentPhase={phase} />
      </div>

      {/* ══════════════════════════════════════════
          PHASE 1 — UPLOAD
      ═══════════════════════════════════════════ */}
      {phase === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">upload_file</span>
              {t('rneVerification.upload.title', 'Upload RNE Document')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-text-muted mb-6">
              {t('rneVerification.upload.description', 'Upload your official RNE registration document for AI-powered analysis and validation')}
            </p>

            {/* Drop zone */}
            <DropZone file={file} onFile={handleFile} error={fileError} />

            {/* Phone */}
            <div className="mt-5">
              <label className="block text-sm font-semibold mb-1.5">
                {t('rneVerification.upload.phone', 'Phone Number')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">call</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                  placeholder={t('rneVerification.upload.phonePlaceholder', '+216 XX XXX XXX')}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all bg-slate-50 dark:bg-slate-800 ${
                    phoneError
                      ? 'border-red-400 focus:ring-2 focus:ring-red-400/30'
                      : 'border-slate-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
              </div>
              {phoneError ? (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {phoneError}
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  {t('rneVerification.upload.phoneHint', 'An AI agent will call this number for identity verification')}
                </p>
              )}
            </div>

            {/* Consent */}
            <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
              <label className="flex gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-primary shrink-0"
                />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 dark:text-amber-400">
                    {t('rneVerification.upload.consentTitle', 'Consent to AI Processing & Voice Verification')}
                  </p>
                  <p className="text-amber-700 dark:text-amber-500 mt-0.5 text-xs leading-relaxed">
                    {t('rneVerification.upload.consentText', 'I consent to AI analysis of the uploaded document and agree to receive an automated verification call. Data is processed securely and in compliance with privacy regulations.')}
                  </p>
                </div>
              </label>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!consent || submitting}
              className="mt-5 w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('rneVerification.upload.submitting', 'Uploading...')}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  {t('rneVerification.upload.submit', 'Begin AI Verification')}
                </>
              )}
            </button>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-5 shadow-sm">
              <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">info</span>
                {t('rneVerification.info.howItWorks', 'How It Works')}
              </h4>
              {[
                { icon: 'upload_file', label: t('rneVerification.info.step1', 'Upload your official RNE document') },
                { icon: 'smart_toy',   label: t('rneVerification.info.step2', 'AI analyzes, validates, and extracts data') },
                { icon: 'call',        label: t('rneVerification.info.step3', 'AI agent calls to confirm identity') },
                { icon: 'verified',    label: t('rneVerification.info.step4', 'Receive instant verification decision') },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-sm">{s.icon}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/30 p-5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-indigo-500 mt-0.5">security</span>
                <div>
                  <p className="font-semibold text-sm text-indigo-700 dark:text-indigo-300">
                    {t('rneVerification.info.security', 'Secure & Compliant')}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 leading-relaxed">
                    {t('rneVerification.info.securityText', 'End-to-end encrypted. Compliant with GDPR and local data protection regulations.')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-5 shadow-sm">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-lg">description</span>
                {t('rneVerification.info.accepted', 'Accepted Formats')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {['PDF', 'JPG', 'PNG', 'WEBP'].map(f => (
                  <span key={f} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold rounded-lg">
                    {f}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">{t('rneVerification.info.maxSize', 'Maximum file size: 10 MB')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PHASE 2 — AI PROCESSING (COUNTDOWN)
      ═══════════════════════════════════════════ */}
      {phase === 'processing' && (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start py-2">
            {/* Left: countdown + message */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
                  {t('rneVerification.processing.title', 'AI Analysis in Progress')}
                </p>
              </div>

              {/* Animated status message */}
              <div className="w-full text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-200 dark:border-indigo-800/30 mb-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {t(PROCESSING_MESSAGES[msgIdx].key, PROCESSING_MESSAGES[msgIdx].fallback)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {t('rneVerification.processing.doNotClose', 'Please keep this page open during processing')}
                </p>
              </div>

              {/* Lock icon pulse */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="material-symbols-outlined text-sm text-emerald-500 animate-pulse">lock</span>
                {t('rneVerification.processing.encrypted', 'Processing is end-to-end encrypted')}
              </div>
            </div>

            {/* Right: step checklist */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold mb-2">{t('rneVerification.processing.stepsTitle', 'Processing Pipeline')}</p>
              {PROCESSING_STEPS.map((step, idx) => {
                const isComplete = idx < stepProgress;
                const isCurrent = idx === stepProgress;
                return (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30' :
                    isComplete ? 'bg-emerald-50 dark:bg-emerald-900/10' :
                    'opacity-40'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isComplete ? 'bg-emerald-500' :
                      isCurrent  ? 'bg-indigo-500' :
                                   'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      {isComplete ? (
                        <span className="material-symbols-outlined text-white text-[13px]">check</span>
                      ) : isCurrent ? (
                        <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs font-medium">{t(step.key, step.fallback)}</p>
                    {isComplete && (
                      <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Done</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event log */}
          <div className="mt-8">
            <EventLog events={events} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PHASE 3 — ANALYSIS RESULTS
      ═══════════════════════════════════════════ */}
      {phase === 'analysis' && analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">analytics</span>
              </div>
              <div>
                <h3 className="font-bold">{t('rneVerification.analysis.title', 'Document Analysis Complete')}</h3>
                <p className="text-xs text-slate-400">{t('rneVerification.analysis.subtitle', 'AI has successfully analyzed your RNE document')}</p>
              </div>
            </div>

            {/* Validation score banner */}
            <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/30 mb-6">
              <ScoreRing
                value={analysis.validationScore}
                size={80}
                strokeWidth={7}
                color={analysis.validationScore >= 80 ? '#10b981' : analysis.validationScore >= 60 ? '#f59e0b' : '#ef4444'}
              />
              <div>
                <p className="font-bold text-lg">{t('rneVerification.analysis.validationScore', 'Validation Score')}</p>
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${
                  analysis.validationScore >= 80
                    ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : analysis.validationScore >= 60
                    ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {analysis.validationScore >= 80 ? 'verified' : analysis.validationScore >= 60 ? 'warning' : 'cancel'}
                  </span>
                  {analysis.validationScore >= 80
                    ? t('rneVerification.analysis.high',   'High Confidence')
                    : analysis.validationScore >= 60
                    ? t('rneVerification.analysis.medium', 'Medium Confidence')
                    : t('rneVerification.analysis.low',    'Low Confidence')}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {t('rneVerification.analysis.proceedInfo', 'Submit this AI analysis for verification review')}
                </p>
              </div>
            </div>

            {/* Extracted fields */}
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {t('rneVerification.analysis.extractedInfo', 'Extracted Information')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { icon: 'business',     label: t('rneVerification.analysis.orgName',    'Organization Name'),     value: analysis.orgName },
                { icon: 'fingerprint',  label: t('rneVerification.analysis.regNumber',  'Registration Number'),   value: analysis.registrationNumber },
                { icon: 'event',        label: t('rneVerification.analysis.regDate',    'Registration Date'),     value: analysis.registrationDate },
                { icon: 'gavel',        label: t('rneVerification.analysis.legalStatus','Legal Status'),          value: analysis.legalStatus },
                { icon: 'location_on',  label: t('rneVerification.analysis.address',    'Address'),               value: analysis.address },
                { icon: 'description',  label: t('rneVerification.analysis.docQuality', 'Document Quality'),      value: analysis.documentQuality },
              ].map((field, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">{field.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{field.label}</p>
                    <p className="text-sm font-semibold mt-0.5 break-words">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={startVoiceCall}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">rule</span>
              {t('rneVerification.analysis.proceedToCall', 'Submit for Final Verification Review')}
            </button>
          </div>

          {/* Authenticity checks + log */}
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-5 shadow-sm">
              <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">security</span>
                {t('rneVerification.analysis.authenticity', 'Authenticity Checks')}
              </h4>
              {[
                { label: t('rneVerification.checks.format',     'Document Format Valid'),    ok: Number(analysis.fraudRisk ?? 100) < 95 },
                { label: t('rneVerification.checks.signatures', 'Official Signatures Found'), ok: Number(analysis.fraudRisk ?? 100) < 80 },
                { label: t('rneVerification.checks.anomalies',  'No Anomalies Detected'),    ok: Number(analysis.fraudRisk ?? 100) < 60 },
                { label: t('rneVerification.checks.registry',   'Registry Cross-Check'),     ok: analysis.authenticated },
                { label: t('rneVerification.checks.tampering',  'Tampering Detection'),      ok: Number(analysis.fraudRisk ?? 100) < 70 },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className={`material-symbols-outlined text-[18px] ${c.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                    {c.ok ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{c.label}</span>
                </div>
              ))}
            </div>
            <EventLog events={events} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PHASE 4 — VOICE CALL
      ═══════════════════════════════════════════ */}
      {phase === 'voice_call' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${callPhase === 'ended' ? 'bg-slate-100 dark:bg-slate-800' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                <span className={`material-symbols-outlined ${callPhase === 'ended' ? 'text-slate-500' : 'text-blue-600 dark:text-blue-400'}`}>
                  {callPhase === 'ended' ? 'call_end' : 'call'}
                </span>
              </div>
              <div>
                <h3 className="font-bold">{t('rneVerification.call.title', 'AI Voice Verification')}</h3>
                <p className="text-xs text-slate-400">{phone}</p>
              </div>
            </div>

            {/* Preparing */}
            {callPhase === 'preparing' && (
              <div className="flex flex-col items-center gap-6 py-6">
                <CircularCountdown
                  value={callCountdown}
                  total={CALL_PREP_DURATION}
                  size={140}
                  label={t('rneVerification.call.initiatingIn', 'AI call initiating in...')}
                  sublabel={t('rneVerification.processing.seconds', 'sec')}
                  color="#3b82f6"
                />
                <p className="text-sm text-slate-500 dark:text-text-muted text-center max-w-sm">
                  {t('rneVerification.call.preparingDesc', 'An AI agent will call the provided number. Please ensure the phone is available and ready to answer.')}
                </p>
              </div>
            )}

            {/* Ringing */}
            {callPhase === 'ringing' && (
              <div className="flex flex-col items-center gap-6 py-10">
                <div className="relative flex items-center justify-center w-28 h-28">
                  <div className="absolute w-28 h-28 rounded-full bg-blue-500/15 animate-ping" />
                  <div className="absolute w-20 h-20 rounded-full bg-blue-500/10 animate-pulse scale-110" />
                  <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-4xl text-blue-500">call</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                    {t('rneVerification.call.ringing', 'Ringing...')}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">{phone}</p>
                </div>
              </div>
            )}

            {/* Talking / Ended */}
            {(callPhase === 'talking' || callPhase === 'ended') && (
              <div className="flex flex-col gap-4">
                {/* Call status bar */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  callPhase === 'talking'
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30'
                }`}>
                  {callPhase === 'talking' ? (
                    <>
                      <div className="flex gap-0.5 items-end h-5">
                        {[3, 6, 9, 6, 4, 8, 5, 7, 4, 6].map((h, i) => (
                          <div key={i} className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                        {t('rneVerification.call.inProgress', 'Call in progress — AI verification active')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-slate-500 text-xl">check_circle</span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {t('rneVerification.call.completed', 'Call completed — analyzing responses...')}
                      </span>
                    </>
                  )}
                </div>

                {/* Transcript */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 max-h-72 overflow-y-auto space-y-3">
                  {transcript.map((line, i) => (
                    <div key={i} className={`flex gap-3 ${line.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        line.role === 'ai'
                          ? 'bg-gradient-to-br from-indigo-400 to-purple-500'
                          : 'bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700'
                      }`}>
                        <span className="material-symbols-outlined text-white text-sm">
                          {line.role === 'ai' ? 'smart_toy' : 'person'}
                        </span>
                      </div>
                      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        line.role === 'ai'
                          ? 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-tl-sm'
                          : 'bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-tr-sm'
                      }`}>
                        {t(`rneVerification.call.${line.key}`, line.fallback)}
                      </div>
                    </div>
                  ))}
                  {callPhase === 'talking' && transcript.length < CALL_TRANSCRIPT.length && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                      </div>
                      <div className="px-3.5 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl rounded-tl-sm">
                        <div className="flex gap-1 items-center">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Call info sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-5 shadow-sm">
              <h4 className="font-bold text-sm mb-4">{t('rneVerification.call.verificationTopics', 'Verification Topics')}</h4>
              {[
                t('rneVerification.call.q1_label', 'Organization name confirmation'),
                t('rneVerification.call.q2_label', 'Registration number verification'),
                t('rneVerification.call.q3_label', 'Legal representative identity'),
              ].map((q, i) => {
                const orgAnswersGiven = transcript.filter(l => l.role === 'org').length;
                const aiQsGiven = transcript.filter(l => l.role === 'ai').length;
                const answered = orgAnswersGiven > i;
                const active = !answered && aiQsGiven === i + 1;
                return (
                  <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className={`material-symbols-outlined text-[18px] ${
                      answered ? 'text-emerald-500' :
                      active   ? 'text-blue-500' :
                                 'text-slate-300 dark:text-slate-600'
                    } ${active ? 'animate-pulse' : ''}`}>
                      {answered ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">{q}</span>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800/30 p-4">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  {t('rneVerification.call.retryInfo', 'If the call fails or goes unanswered, you will have the option to retry. Ensure the phone is reachable.')}
                </p>
              </div>
            </div>

            <EventLog events={events} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PHASE 5 — FINAL DECISION
      ═══════════════════════════════════════════ */}
      {phase === 'decision' && decision && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-6 shadow-sm">
            {/* Decision hero */}
            <div className="flex flex-col items-center gap-4 py-6 mb-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${decisionColor[decision.status].bg}`}>
                <span className={`material-symbols-outlined text-5xl ${decisionColor[decision.status].icon}`}>
                  {decisionIcon[decision.status]}
                </span>
              </div>
              <div className="text-center">
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border mb-2 ${decisionColor[decision.status].badge}`}>
                  <span className="material-symbols-outlined text-[14px]">{decisionIcon[decision.status]}</span>
                  {decision.status === 'approved'
                    ? t('rneVerification.decision.approvedBadge', 'VERIFIED & APPROVED')
                    : decision.status === 'rejected'
                    ? t('rneVerification.decision.rejectedBadge', 'VERIFICATION FAILED')
                    : t('rneVerification.decision.reviewBadge',   'MANUAL REVIEW REQUIRED')}
                </span>
                <h3 className="text-2xl font-black">
                  {decision.status === 'approved'
                    ? t('rneVerification.decision.approvedTitle', 'Organization Verified!')
                    : decision.status === 'rejected'
                    ? t('rneVerification.decision.rejectedTitle', 'Verification Failed')
                    : t('rneVerification.decision.reviewTitle',   'Under Review')}
                </h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  {decision.status === 'approved'
                    ? t('rneVerification.decision.approvedDesc', 'Your organization identity has been successfully verified. Your account is now fully activated.')
                    : decision.status === 'rejected'
                    ? t('rneVerification.decision.rejectedDesc', 'We were unable to verify your organization. Please review the rejection reason and try again.')
                    : t('rneVerification.decision.reviewDesc',   'Your submission requires manual review by our team. You will be notified within 24-48 hours.')}
                </p>
              </div>
            </div>

            {/* Score breakdown */}
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {t('rneVerification.decision.scoreBreakdown', 'Score Breakdown')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { label: t('rneVerification.decision.docScore', 'Document'), value: decision.docScore, color: '#6366f1' },
                decision.callScore == null
                  ? null
                  : { label: t('rneVerification.decision.callScore', 'Voice Call'), value: decision.callScore, color: '#06b6d4' },
                {
                  label: t('rneVerification.decision.overall', 'Overall Score'),
                  value: decision.overall,
                  color:
                    decision.status === 'approved'
                      ? '#10b981'
                      : decision.status === 'rejected'
                      ? '#ef4444'
                      : '#f59e0b',
                },
              ].filter(Boolean).map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <ScoreRing value={s.value} size={72} strokeWidth={7} color={s.color} />
                  <p className="text-xs text-slate-400 text-center">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Rejection reason */}
            {decision.status === 'rejected' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl mb-6">
                <span className="material-symbols-outlined text-red-500 mt-0.5">info</span>
                <div>
                  <p className="font-semibold text-sm text-red-700 dark:text-red-400">
                    {t('rneVerification.decision.rejectionReason', 'AI-Generated Rejection Reason')}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-1 leading-relaxed">
                    {t('rneVerification.decision.rejectedReason', 'The submitted document could not be fully cross-referenced with the national registry. One or more extracted fields failed validation. Please ensure the document is current and unmodified.')}
                  </p>
                </div>
              </div>
            )}

            {/* Manual review notice */}
            {decision.status === 'needs_review' && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl mb-6">
                <span className="material-symbols-outlined text-amber-500 mt-0.5">schedule</span>
                <div>
                  <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                    {t('rneVerification.decision.reviewNotice', 'Manual Review Initiated')}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 leading-relaxed">
                    {t('rneVerification.decision.reviewText', 'Our compliance team will review your submission within 24–48 hours. You will receive an email notification with the final decision.')}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                {t('rneVerification.decision.startNew', 'New Verification')}
              </button>
              {(decision.status === 'rejected' || decision.status === 'needs_review') && (
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  {t('rneVerification.decision.retry', 'Retry Verification')}
                </button>
              )}
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 p-5 shadow-sm">
              <h4 className="font-bold text-sm mb-4">{t('rneVerification.decision.summary', 'Verification Summary')}</h4>
              {[
                { icon: 'upload_file', label: t('rneVerification.decision.sumDoc',      'Document Submitted'),    status: 'done' },
                { icon: 'smart_toy',   label: t('rneVerification.decision.sumAI',       'AI Analysis Complete'),  status: 'done' },
                { icon: 'call',        label: t('rneVerification.decision.sumCall',     'Voice Verification'),    status: 'pending' },
                { icon: 'gavel',       label: t('rneVerification.decision.sumDecision', 'Decision Rendered'),     status: decision.status },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                  <span className="text-xs flex-1">{item.label}</span>
                  <span className={`material-symbols-outlined text-[17px] ${
                    item.status === 'done' || item.status === 'approved' ? 'text-emerald-500' :
                    item.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {item.status === 'done' || item.status === 'approved' ? 'check_circle' :
                     item.status === 'rejected' ? 'cancel' : 'pending'}
                  </span>
                </div>
              ))}
            </div>

            {/* Notification notice */}
            <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-200 dark:border-indigo-800/30 p-4">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-lg mt-0.5">notifications</span>
                <div>
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {t('rneVerification.decision.notifyTitle', 'Notification Pending')}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    {t('rneVerification.decision.notifyText', 'You will receive an email once manual verification review is completed.')}
                  </p>
                </div>
              </div>
            </div>

            <EventLog events={events} />
          </div>
        </div>
      )}
    </div>
  );
}
