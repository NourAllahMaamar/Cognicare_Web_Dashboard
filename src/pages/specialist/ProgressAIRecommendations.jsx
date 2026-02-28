import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { cachedGet } from '../../apiClient';
import '../org-leader/OrgLeaderDashboard_OLD.css';
import './SpecialistDashboard_OLD.css';

export default function ProgressAIRecommendations() {
    const { childId } = useParams();
    const navigate = useNavigate();
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
        const edited = prompt('Modifier le texte (optionnel):', originalText);
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
        if (!window.confirm('Ignorer cette recommandation ?')) return;
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
        <div className="org-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <button
                            type="button"
                            className="back-button"
                            onClick={() => navigate('/specialist/dashboard')}
                            style={{ marginRight: 12 }}
                        >
                            ← Retour
                        </button>
                        <h1 className="dashboard-title">Recommandations IA</h1>
                        <p className="dashboard-subtitle">Enfant ID: {childId}</p>
                    </div>
                </div>
            </header>

            {error && <div className="error-banner">❌ {error}</div>}

            {loading && (
                <div className="sp-overview" style={{ padding: 40, textAlign: 'center' }}>
                    Chargement des recommandations…
                </div>
            )}

            {!loading && data && (
                <main className="dashboard-main" style={{ maxWidth: 800, margin: '0 auto' }}>
                    <section className="sp-section">
                        <h2 className="sp-section-title">Résumé</h2>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{data.summary}</p>
                    </section>

                    {data.milestones && (
                        <section className="sp-section">
                            <h2 className="sp-section-title">Jalons</h2>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{data.milestones}</p>
                        </section>
                    )}

                    {data.predictions && (
                        <section className="sp-section">
                            <h2 className="sp-section-title">Prédictions</h2>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{data.predictions}</p>
                        </section>
                    )}

                    <section className="sp-section">
                        <h2 className="sp-section-title">Recommandations par type de plan</h2>
                        {(data.recommendations || []).length === 0 ? (
                            <p>Aucune recommandation pour le moment.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {(data.recommendations || []).map((rec, index) => (
                                    <li
                                        key={`${rec.planType}-${index}`}
                                        style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 12,
                                            padding: 16,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <strong>[{rec.planType}]</strong>
                                        <p style={{ margin: '8px 0' }}>{rec.text}</p>
                                        {feedbackSent.has(index) ? (
                                            <span style={{ color: 'green' }}>✓ Envoyé</span>
                                        ) : pendingFeedback?.index === index ? (
                                            <div style={{ marginTop: 12 }}>
                                                {(pendingFeedback.action === 'approved' || pendingFeedback.action === 'modified') && (
                                                    <>
                                                        <p>Résultats améliorés ?</p>
                                                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                                            <button
                                                                type="button"
                                                                className="sp-btn-delete"
                                                                onClick={() => setResultsImproved(false)}
                                                            >
                                                                Non
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="sp-btn-view-board"
                                                                onClick={() => setResultsImproved(true)}
                                                            >
                                                                Oui
                                                            </button>
                                                        </div>
                                                        {resultsImproved !== null && (
                                                            <>
                                                                <p>Le retour du parent a-t-il été utile ?</p>
                                                                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                                                    <button type="button" onClick={() => setParentFeedbackHelpful('skip')}>Passer</button>
                                                                    <button type="button" onClick={() => setParentFeedbackHelpful(false)}>Non</button>
                                                                    <button type="button" onClick={() => setParentFeedbackHelpful(true)}>Oui</button>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="sp-action-card"
                                                                    onClick={confirmPendingFeedback}
                                                                >
                                                                    Envoyer
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {pendingFeedback.action === 'dismissed' && (
                                                    <button
                                                        type="button"
                                                        className="sp-action-card"
                                                        onClick={confirmPendingFeedback}
                                                    >
                                                        Confirmer ignorer
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                <button
                                                    type="button"
                                                    className="sp-btn-view-board"
                                                    onClick={() => handleApprove(index, rec.planType, rec.text)}
                                                >
                                                    Approuver
                                                </button>
                                                <button
                                                    type="button"
                                                    className="sp-btn-delete"
                                                    onClick={() => handleModify(index, rec.planType, rec.text)}
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    type="button"
                                                    className="sp-btn-delete"
                                                    onClick={() => handleDismiss(index, rec.planType, rec.text)}
                                                >
                                                    Ignorer
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
