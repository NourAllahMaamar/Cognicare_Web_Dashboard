import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getUploadUrl } from '../../config';

const TRIALS_PER_CARD = 10;
const MASTERY_THRESHOLD = 8;

export default function PECSBoardCreator() {
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const navigate = useNavigate();
  const { authFetch, authMutate } = useAuth('specialist');
  const { t } = useTranslation();

  // Generate PECS phases from translations
  const PECS_PHASES = useMemo(() => [
    { id: 1, name: t('pecsCreator.phases.phase1.name'), description: t('pecsCreator.phases.phase1.description'), criteria: t('pecsCreator.phases.phase1.criteria'), tips: t('pecsCreator.phases.phase1.tips') },
    { id: 2, name: t('pecsCreator.phases.phase2.name'), description: t('pecsCreator.phases.phase2.description'), criteria: t('pecsCreator.phases.phase2.criteria'), tips: t('pecsCreator.phases.phase2.tips') },
    { id: 3, name: t('pecsCreator.phases.phase3.name'), description: t('pecsCreator.phases.phase3.description'), criteria: t('pecsCreator.phases.phase3.criteria'), tips: t('pecsCreator.phases.phase3.tips') },
    { id: 4, name: t('pecsCreator.phases.phase4.name'), description: t('pecsCreator.phases.phase4.description'), criteria: t('pecsCreator.phases.phase4.criteria'), tips: t('pecsCreator.phases.phase4.tips') },
    { id: 5, name: t('pecsCreator.phases.phase5.name'), description: t('pecsCreator.phases.phase5.description'), criteria: t('pecsCreator.phases.phase5.criteria'), tips: t('pecsCreator.phases.phase5.tips') },
    { id: 6, name: t('pecsCreator.phases.phase6.name'), description: t('pecsCreator.phases.phase6.description'), criteria: t('pecsCreator.phases.phase6.criteria'), tips: t('pecsCreator.phases.phase6.tips') },
  ], [t]);

  const [title, setTitle] = useState('');
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [items, setItems] = useState([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { if (!childId) setError(t('pecsCreator.childRequired')); }, [childId, t]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/specialist/dashboard/children');
  };

  const currentPhase = PECS_PHASES.find(p => p.id === selectedPhase);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) { setError(t('pecsCreator.imageError')); return; }
    setUploadingImage(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/specialized-plans/upload-image', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || t('pecsCreator.uploadFailed'));
      const { imageUrl } = await res.json();
      setNewItemImage(imageUrl);
      setSuccess('Image uploaded');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    setUploadingImage(false);
    e.target.value = '';
  };

  const addItem = () => {
    if (!newItemLabel) return;
    setItems([...items, { id: Date.now().toString(), label: newItemLabel, imageUrl: newItemImage || `https://via.placeholder.com/120?text=${encodeURIComponent(newItemLabel)}`, trials: Array(TRIALS_PER_CARD).fill(null) }]);
    setNewItemLabel('');
    setNewItemImage('');
  };

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  const toggleTrial = (itemId, index) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      const t = [...item.trials];
      t[index] = t[index] === null ? 'pass' : t[index] === 'pass' ? 'fail' : null;
      return { ...item, trials: t };
    }));
  };

  const getStats = (item) => {
    const pass = (item.trials || []).filter(t => t === 'pass').length;
    return { pass, mastered: pass >= MASTERY_THRESHOLD };
  };

  const handleSave = async () => {
    if (!childId) { setError(t('pecsCreator.noChild')); return; }
    if (!title || items.length === 0) { setError(t('pecsCreator.validationError')); return; }
    setLoading(true);
    try {
      await authMutate('/specialized-plans', { body: { childId, type: 'PECS', title, content: { phase: selectedPhase, phaseName: currentPhase.name, items: items.map(it => ({ ...it, ...getStats(it) })), criteria: currentPhase.criteria } } });
      setSuccess('Board saved!');
      setTimeout(() => navigate('/specialist/dashboard/children'), 1200);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const inputCls = 'w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{t('pecsCreator.title')}</h1>
              <p className="text-sm text-slate-500">{t('pecsCreator.subtitle')}</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
            {loading ? t('pecsCreator.saving') : t('pecsCreator.saveBoard')}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium mb-4">{error}</div>}
        {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium mb-4">{success}</div>}

        {/* Stepper */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[t('pecsCreator.stepTitle'), t('pecsCreator.stepPhase'), t('pecsCreator.stepCards'), t('pecsCreator.stepTrials'), t('pecsCreator.stepSave')].map((step, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold whitespace-nowrap">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Settings Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5">
              <label className="block text-sm font-bold mb-2">{t('pecsCreator.boardTitle')}</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('pecsCreator.titlePlaceholder')} className={inputCls} />
            </div>

            {/* Phase Selector */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5">
              <label className="block text-sm font-bold mb-2">{t('pecsCreator.phase')}</label>
              <select value={selectedPhase} onChange={e => setSelectedPhase(Number(e.target.value))} className={inputCls}>
                {PECS_PHASES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {currentPhase && (
                <div className="mt-3 p-4 bg-primary/5 rounded-xl space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{currentPhase.description}</p>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">checklist</span>
                    <span><strong>{t('pecsCreator.criteria')}:</strong> {currentPhase.criteria}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-warning text-sm mt-0.5">lightbulb</span>
                    <span><strong>{t('pecsCreator.tips')}:</strong> {currentPhase.tips}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Add Card */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">add_photo_alternate</span>
                {t('pecsCreator.addCard')}
              </h3>
              <div className="space-y-3">
                <input type="text" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} placeholder={t('pecsCreator.labelPlaceholder')} className={inputCls} />
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary/5 text-primary rounded-xl text-xs font-bold cursor-pointer hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    {uploadingImage ? t('pecsCreator.uploading') : t('pecsCreator.uploadImage')}
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                  </label>
                </div>
                <input type="text" value={newItemImage} onChange={e => setNewItemImage(e.target.value)} placeholder={t('pecsCreator.imageUrl')} className={inputCls} />
                {newItemImage && <img src={getUploadUrl(newItemImage)} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />}
                <button onClick={addItem} disabled={!newItemLabel} className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors">
                  {t('pecsCreator.addToBoard')}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Board */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
              <h3 className="text-lg font-bold mb-1">{t('pecsCreator.board')}</h3>
              <p className="text-xs text-slate-400 mb-4">{items.length} {t('pecsCreator.cards')} "" {t('pecsCreator.trialInstructions')}</p>

              {items.length === 0 ? (
                <div className="p-8 md:p-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">grid_view</span>
                  <p>{t('pecsCreator.emptyState')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map(item => {
                    const { pass, mastered } = getStats(item);
                    return (
                      <div key={item.id} className={`rounded-xl border p-4 ${mastered ? 'border-success bg-success/5' : 'border-slate-200 dark:border-slate-700'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <img src={getUploadUrl(item.imageUrl) || item.imageUrl} alt={item.label} className="w-14 h-14 rounded-xl object-cover bg-slate-100"
                            onError={e => { e.target.src = `https://via.placeholder.com/120?text=${encodeURIComponent(item.label)}`; }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{item.label}</p>
                            <p className="text-xs text-slate-400">{pass}/{TRIALS_PER_CARD} {mastered ? `${t('pecsCreator.mastered')}` : ''}</p>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="p-1 text-error hover:bg-error/5 rounded-lg">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-10 gap-1">
                          {(item.trials || []).map((trial, i) => (
                            <button key={i} onClick={() => toggleTrial(item.id, i)} className={`w-full aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${trial === 'pass' ? 'bg-success text-white' : trial === 'fail' ? 'bg-error text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}>
                              {trial === 'pass' ? '✓' : trial === 'fail' ? '✕' : i + 1}
                            </button>
                          ))}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${mastered ? 'bg-success' : 'bg-primary'}`} style={{ width: `${(pass / TRIALS_PER_CARD) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
