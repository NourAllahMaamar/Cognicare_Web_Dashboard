import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import './OrgLeaderDashboard.css';

export default function OrgSpecialistDetail() {
    const { specialistId } = useParams();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [specialistInfo, setSpecialistInfo] = useState(null);

    const token = localStorage.getItem('orgLeaderToken');

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem('orgLeaderToken');
        localStorage.removeItem('orgLeaderRefreshToken');
        localStorage.removeItem('orgLeaderUser');
        navigate('/org/login');
    }, [navigate]);

    // Fetch specialist summary
    const fetchSpecialistSummary = useCallback(async () => {
        if (!specialistId || !token) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(
                `${API_BASE_URL}/progress-ai/org/specialist/${specialistId}/summary`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: 'include',
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
            const data = await res.json();
            setSummary(data);
        } catch (e) {
            setError(e.message || 'Failed to load specialist summary');
        } finally {
            setLoading(false);
        }
    }, [specialistId, token, handleUnauthorized]);

    // Fetch specialist basic info (name, role) from staff list
    const fetchSpecialistInfo = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/organization/my-organization/staff`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            if (res.ok) {
                const staff = await res.json();
                const specialist = Array.isArray(staff)
                    ? staff.find((s) => (s._id || s.id) === specialistId)
                    : null;
                if (specialist) {
                    setSpecialistInfo({
                        name: specialist.fullName || 'Spécialiste',
                        role: specialist.role || 'specialist',
                        email: specialist.email || '',
                    });
                }
            }
        } catch (e) {
            console.error('Failed to fetch specialist info:', e);
        }
    }, [specialistId, token, handleUnauthorized]);

    useEffect(() => {
        fetchSpecialistSummary();
        fetchSpecialistInfo();
    }, [fetchSpecialistSummary, fetchSpecialistInfo]);

    if (loading) {
        return (
            <div className="org-dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Chargement du résumé du spécialiste...</p>
            </div>
        );
    }

    return (
        <div className="org-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <button
                            type="button"
                            className="back-button"
                            onClick={() => navigate('/org/dashboard')}
                            style={{ marginRight: 12 }}
                        >
                            ← Retour au tableau de bord
                        </button>
                        <h1 className="dashboard-title">
                            🤖 Résumé Progress AI
                            {specialistInfo && ` – ${specialistInfo.name}`}
                        </h1>
                        {specialistInfo && (
                            <p className="dashboard-subtitle">
                                {specialistInfo.email} • {specialistInfo.role}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                {error && (
                    <div className="error-banner">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {summary && (
                    <div className="tab-content">
                        <section className="dashboard-section" style={{ marginTop: 24 }}>
                            <h3 className="section-title">📊 Statistiques générales</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">📋</div>
                                    <div className="stat-info">
                                        <h3>Plans totaux</h3>
                                        <p className="stat-value">{summary.totalPlans ?? 0}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">👶</div>
                                    <div className="stat-info">
                                        <h3>Enfants suivis</h3>
                                        <p className="stat-value">{summary.childrenCount ?? 0}</p>
                                    </div>
                                </div>
                                {summary.approvalRatePercent != null && (
                                    <div className="stat-card">
                                        <div className="stat-icon">✓</div>
                                        <div className="stat-info">
                                            <h3>Taux d'approbation</h3>
                                            <p className="stat-value">{summary.approvalRatePercent}%</p>
                                            <span className="stat-subtitle">
                                                {summary.approvedCount ?? 0} approuvés sur{' '}
                                                {summary.totalFeedback ?? 0} retours
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {summary.resultsImprovedRatePercent != null && (
                                    <div className="stat-card">
                                        <div className="stat-icon">📈</div>
                                        <div className="stat-info">
                                            <h3>Résultats améliorés</h3>
                                            <p className="stat-value">
                                                {summary.resultsImprovedRatePercent}%
                                            </p>
                                            <span className="stat-subtitle">
                                                {summary.resultsImprovedTrueCount ?? 0} améliorations
                                                confirmées
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {summary.planCountByType && Object.keys(summary.planCountByType).length > 0 && (
                            <section className="dashboard-section" style={{ marginTop: 24 }}>
                                <h3 className="section-title">📋 Plans par type</h3>
                                <div className="stats-grid">
                                    {Object.entries(summary.planCountByType).map(([type, count]) => (
                                        <div key={type} className="stat-card">
                                            <div className="stat-info">
                                                <h3>{type}</h3>
                                                <p className="stat-value">{count}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {summary.totalFeedback != null && summary.totalFeedback > 0 && (
                            <section className="dashboard-section" style={{ marginTop: 24 }}>
                                <h3 className="section-title">📝 Détails des retours</h3>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-info">
                                            <h3>Approuvés</h3>
                                            <p className="stat-value">{summary.approvedCount ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-info">
                                            <h3>Modifiés</h3>
                                            <p className="stat-value">{summary.modifiedCount ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-info">
                                            <h3>Ignorés</h3>
                                            <p className="stat-value">{summary.dismissedCount ?? 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {!summary && !error && (
                    <div className="empty-state">
                        <p>Aucune donnée disponible pour ce spécialiste.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
