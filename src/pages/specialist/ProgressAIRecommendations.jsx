import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config';
import { cachedGet } from '../../apiClient';

export default function ProgressAIRecommendations() {
    const { childId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(new Set());
    const [pendingFeedback, setPendingFeedback] = useState(null); // { index, action, editedText?, planType, originalText }
    const [resultsImproved, setResultsImproved] = useState(null); // true | false
    const [parentFeedbackHelpful, setParentFeedbackHelpful] = useState(null); // true | false | 'skip'

    const token = localStorage.getItem('specialistToken');

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem('specialistToken');
        localStorage.removeItem('specialistRefreshToken');
        localStorage.removeItem('specialistUser');
        navigate('/specialist/login');
    }, [navigate]);

    const fetchRecommendations = useCallback(async () => {
        if (!childId || !token) return;
        setLoading(true);
        setError('');
        try {
            const json = await cachedGet(
                `/progress-ai/child/${childId}/recommendations`,
                { ttlMs: 30_000, token }
            );
            setData(json);
        } catch (e) {
            if (e.status === 401) {
                handleUnauthorized();
                return;
            }
            setError(e.message || 'Failed to load recommendations');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [childId, token, handleUnauthorized]);

    useEffect(() => {
        fetchRecommendations();
        const interval = setInterval(fetchRecommendations, 30000);
        return () => clearInterval(interval);
    }, [fetchRecommendations]);

    const submitFeedback = async (payload) => {
        if (!token || !data?.recommendationId) return;
        try {
            const res = await fetch(
                `${API_BASE_URL}/progress-ai/recommendations/${data.recommendationId}/feedback`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                }
            );
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${res.status}`);
            }
            setFeedbackSent((prev) => new Set(prev).add(pendingFeedback.index));
            setPendingFeedback(null);
            setResultsImproved(null);
            setParentFeedbackHelpful(null);
            fetchRecommendations();
        } catch (e) {
            setError(e.message || 'Failed to submit feedback');
        }
    };

    const handleApprove = (index, planType, originalText) => {
        setPendingFeedback({ index, action: 'approved', planType, originalText });
        setResultsImproved(null);
        setParentFeedbackHelpful(null);
    };
    const handleModify = (index, planType, originalText) => {
        const edited = prompt(t('progressAI.modifyPrompt'), originalText);
        if (edited === null) return;
        setPendingFeedback({
            index,
            action: 'modified',
            planType,
            originalText,
            editedText: edited || undefined,
        });
        setResultsImproved(null);
        setParentFeedbackHelpful(null);
    };
    const handleDismiss = (index, planType, originalText) => {
        if (!window.confirm(t('progressAI.dismissConfirm'))) return;
        setPendingFeedback({ index, action: 'dismissed', planType, originalText });
    };

    const confirmPendingFeedback = () => {
        if (!pendingFeedback || !data) return;
        const { action, planType, originalText, editedText } = pendingFeedback;
        const payload = {
            childId,
            action,
            planType: planType || undefined,
            originalRecommendationText: originalText || undefined,
            editedText: editedText || undefined,
        };
        if (action === 'approved' || action === 'modified') {
            if (resultsImproved === null) return; // must answer first
            payload.resultsImproved = resultsImproved;
            if (parentFeedbackHelpful !== null && parentFeedbackHelpful !== 'skip') {
                payload.parentFeedbackHelpful = parentFeedbackHelpful;
            }
        }
        submitFeedback(payload);
    };

    if (!token) {
        navigate('/specialist/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-bg-dark">
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/specialist/dashboard')}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold">{t('progressAI.title')}</h1>
                            <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{t('progressAI.childId')}: {childId}</p>
                        </div>
                    </div>
                </div>
            </header>

            {error && (
                <div className="max-w-5xl mx-auto px-6 pt-6">
                    <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-lg shrink-0">error</span>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                </div>
            )}

            {loading && (
                <div className="max-w-5xl mx-auto px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-400 font-medium">{t('progressAI.loading')}</p>
                    </div>
                </div>
            )}

            {!loading && data && (
                <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                    <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
                        <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">summarize</span>
                            {t('progressAI.summary')}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{data.summary}</p>
                    </section>

                    {data.milestones && (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
                            <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">flag</span>
                                {t('progressAI.milestones')}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{data.milestones}</p>
                        </section>
                    )}

                    {data.predictions && (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
                            <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">insights</span>
                                {t('progressAI.predictions')}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{data.predictions}</p>
                        </section>
                    )}

                    <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">psychology</span>
                            {t('progressAI.recommendationsByType')}
                        </h2>
                        {(data.recommendations || []).length === 0 ? (
                            <p className="text-slate-400 text-center py-8">{t('progressAI.noRecommendations')}</p>
                        ) : (
                            <ul className="space-y-4">
                                {(data.recommendations || []).map((rec, index) => (
                                    <li
                                        key={`${rec.planType}-${index}`}
                                        className="border border-slate-300 dark:border-slate-700 rounded-xl p-4"
                                    >
                                        <strong className="text-primary text-sm font-bold">[{rec.planType}]</strong>
                                        <p className="text-slate-600 dark:text-slate-400 my-3 leading-relaxed">{rec.text}</p>
                                        {feedbackSent.has(index) ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-lg text-sm font-medium">
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                {t('progressAI.sent')}
                                            </span>
                                        ) : pendingFeedback?.index === index ? (
                                            <div className="mt-4 space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                {(pendingFeedback.action === 'approved' || pendingFeedback.action === 'modified') && (
                                                    <>
                                                        <div>
                                                            <p className="text-sm font-medium mb-2">{t('progressAI.resultsImproveQuestion')}</p>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setResultsImproved(false)}
                                                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-sm font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                                >
                                                                    {t('progressAI.no')}
                                                                </button>
                                                                <button
                                                                    onClick={() => setResultsImproved(true)}
                                                                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                                                >
                                                                    {t('progressAI.yes')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {resultsImproved !== null && (
                                                            <>
                                                                <div>
                                                                    <p className="text-sm font-medium mb-2">{t('progressAI.parentFeedbackQuestion')}</p>
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => setParentFeedbackHelpful('skip')}
                                                                            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                                        >
                                                                            {t('progressAI.skip')}
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setParentFeedbackHelpful(false)}
                                                                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-sm font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                                        >
                                                                            {t('progressAI.no')}
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setParentFeedbackHelpful(true)}
                                                                            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                                                        >
                                                                            {t('progressAI.yes')}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={confirmPendingFeedback}
                                                                    className="w-full px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                                                >
                                                                    {t('progressAI.send')}
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {pendingFeedback.action === 'dismissed' && (
                                                    <button
                                                        onClick={confirmPendingFeedback}
                                                        className="w-full px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-sm font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                    >
                                                        {t('progressAI.confirmDismiss')}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleApprove(index, rec.planType, rec.text)}
                                                    className="px-4 py-2 bg-success/10 text-success text-sm font-bold rounded-lg hover:bg-success/20 transition-colors"
                                                >
                                                    {t('progressAI.approve')}
                                                </button>
                                                <button
                                                    onClick={() => handleModify(index, rec.planType, rec.text)}
                                                    className="px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 transition-colors"
                                                >
                                                    {t('progressAI.modify')}
                                                </button>
                                                <button
                                                    onClick={() => handleDismiss(index, rec.planType, rec.text)}
                                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    {t('progressAI.dismiss')}
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </main>
            )}
        </div>
    );
}


