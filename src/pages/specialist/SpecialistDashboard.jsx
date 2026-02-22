import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { API_BASE_URL, getUploadUrl } from '../../config';
import '../org-leader/OrgLeaderDashboard.css';
import './SpecialistDashboard.css';

function SpecialistDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [orgChildren, setOrgChildren] = useState([]);
    const [privateChildren, setPrivateChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [childPlans, setChildPlans] = useState([]);
    const [myPlans, setMyPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
    const [familyModalMode, setFamilyModalMode] = useState('add'); // 'add', 'create', or 'edit'
    const [familyEmail, setFamilyEmail] = useState('');
    const [editingFamily, setEditingFamily] = useState(null);
    const [existingChildren, setExistingChildren] = useState([]);
    const [childrenToDelete, setChildrenToDelete] = useState([]);
    const [newFamily, setNewFamily] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        children: []
    });
    const [addChildLoading, setAddChildLoading] = useState(false);
    const [expandedPlanId, setExpandedPlanId] = useState(null);
    const [planTypeFilter, setPlanTypeFilter] = useState('all'); // 'all' | 'PECS' | 'TEACCH' | 'SkillTracker' | 'Activity'
    const navigate = useNavigate();

    const filteredChildPlans = planTypeFilter === 'all'
        ? childPlans
        : childPlans.filter(p => p.type === planTypeFilter);
    const filteredMyPlans = planTypeFilter === 'all'
        ? myPlans
        : myPlans.filter(p => p.type === planTypeFilter);
    const { t } = useTranslation();

    const user = JSON.parse(localStorage.getItem('specialistUser') || '{}');
    const token = localStorage.getItem('specialistToken');

    const allChildren = [...orgChildren, ...privateChildren];

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem('specialistToken');
        localStorage.removeItem('specialistRefreshToken');
        localStorage.removeItem('specialistUser');
        navigate('/specialist/login');
    }, [navigate]);

    // ── Fetch organization children ──
    const fetchOrgChildren = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/organization/my-organization/children`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });
            if (response.status === 401) { handleUnauthorized(); return; }
            if (response.ok) {
                const data = await response.json();
                setOrgChildren(Array.isArray(data) ? data.map(c => ({ ...c, _source: 'org' })) : []);
            }
        } catch (err) {
            console.error('Failed to fetch org children:', err);
        }
    }, [token, handleUnauthorized]);

    // ── Fetch private children ──
    const fetchPrivateChildren = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/children/specialist/my-children`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });
            if (response.status === 401) { handleUnauthorized(); return; }
            if (response.ok) {
                const data = await response.json();
                setPrivateChildren(Array.isArray(data) ? data.map(c => ({ ...c, _source: 'private' })) : []);
            }
        } catch (err) {
            console.error('Failed to fetch private children:', err);
        }
    }, [token, handleUnauthorized]);

    // ── Fetch MY plans ──
    const fetchMyPlans = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/specialized-plans/my-plans`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });
            if (response.status === 401) { handleUnauthorized(); return; }
            if (response.ok) {
                const data = await response.json();
                setMyPlans(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch my plans:', err);
        }
    }, [token, handleUnauthorized]);

    // ── Fetch plans for a specific child ──
    const fetchChildPlans = async (childId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/specialized-plans/child/${childId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });
            if (response.status === 401) { handleUnauthorized(); return; }
            if (response.ok) {
                const data = await response.json();
                setChildPlans(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch child plans:', err);
        }
    };

    // ── Delete a plan ──
    const handleDeletePlan = async (planId) => {
        if (!window.confirm(t('specialistDashboard.messages.deleteConfirm'))) return;
        try {
            const response = await fetch(`${API_BASE_URL}/specialized-plans/${planId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });
            if (response.status === 401) { handleUnauthorized(); return; }
            if (response.ok) {
                setSuccessMessage(t('specialistDashboard.messages.deleteSuccess'));
                if (selectedChild) fetchChildPlans(selectedChild._id);
                fetchMyPlans();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                const data = await response.json().catch(() => ({}));
                setError(data.message || t('specialistDashboard.messages.deleteError'));
            }
        } catch (err) {
            setError(t('specialistDashboard.messages.deleteError'));
        }
    };

    // ── Family Modal Helpers ──
    const handleAddChildField = () => {
        setNewFamily({
            ...newFamily,
            children: [
                ...newFamily.children,
                {
                    fullName: '',
                    dateOfBirth: '',
                    gender: 'male',
                    diagnosis: '',
                    medicalHistory: '',
                    allergies: '',
                    medications: '',
                    notes: ''
                }
            ]
        });
    };

    const handleRemoveChildField = (index) => {
        setNewFamily({
            ...newFamily,
            children: newFamily.children.filter((_, i) => i !== index)
        });
    };

    const handleChildFieldChange = (index, field, value) => {
        const updatedChildren = [...newFamily.children];
        updatedChildren[index][field] = value;
        setNewFamily({ ...newFamily, children: updatedChildren });
    };

    const handleExistingChildChange = (index, field, value) => {
        const updatedChildren = [...existingChildren];
        updatedChildren[index][field] = value;
        updatedChildren[index]._modified = true;
        setExistingChildren(updatedChildren);
    };

    const handleDeleteExistingChild = (index) => {
        const child = existingChildren[index];
        const childId = child._id || child.id;
        if (window.confirm(t('orgDashboard.messages.confirmDeleteChild') + ` (${child.fullName})`)) {
            setChildrenToDelete([...childrenToDelete, childId]);
            setExistingChildren(existingChildren.filter((_, i) => i !== index));
        }
    };

    // ── Add/Create Family handler ──
    const handleAddFamily = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setAddChildLoading(true);

        try {
            let response;
            if (familyModalMode === 'create') {
                // Create new private family with children
                response = await fetch(`${API_BASE_URL}/children/specialist/add-family`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newFamily)
                });
            } else {
                // Placeholder for linking existing family (not yet supported for specialists in backend)
                setError(t('specialistDashboard.messages.inviteNotSupported'));
                setAddChildLoading(false);
                return;
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add family');

            setSuccessMessage(t('orgDashboard.messages.familyCreateSuccess'));
            setShowAddFamilyModal(false);
            setNewFamily({ fullName: '', email: '', phone: '', password: '', children: [] });
            fetchPrivateChildren();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setAddChildLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/specialist/login');
            return;
        }
        Promise.all([fetchOrgChildren(), fetchPrivateChildren(), fetchMyPlans()])
            .finally(() => setLoading(false));
    }, [token, navigate, fetchOrgChildren, fetchPrivateChildren, fetchMyPlans]);

    const handleChildSelect = (child) => {
        setSelectedChild(child);
        fetchChildPlans(child._id);
        setActiveTab('children');
    };

    const handleLogout = () => {
        localStorage.removeItem('specialistToken');
        localStorage.removeItem('specialistRefreshToken');
        localStorage.removeItem('specialistUser');
        navigate('/specialist/login');
    };

    // ── Stats ──
    const totalPlans = myPlans.length;
    const pecsCount = myPlans.filter(p => p.type === 'PECS').length;
    const teacchCount = myPlans.filter(p => p.type === 'TEACCH').length;

    if (loading) {
        return (
            <div className="org-dashboard-loading">
                <div className="loading-spinner"></div>
                <p>{t('orgDashboard.loading')}</p>
            </div>
        );
    }

    const badgeColor = (type) => {
        switch (type) {
            case 'PECS': return '#6366f1';
            case 'TEACCH': return '#f59e0b';
            case 'SkillTracker': return '#10b981';
            case 'Activity': return '#ec4899';
            default: return '#64748b';
        }
    };

    const planTypeLabel = (type) => {
        switch (type) {
            case 'PECS': return 'PECS';
            case 'TEACCH': return 'TEACCH';
            case 'SkillTracker': return t('specialistDashboard.childDetail.skillTracker') || 'Skill Tracker';
            case 'Activity': return t('specialistDashboard.childDetail.assignGames') || 'Activity';
            default: return type || 'Plan';
        }
    };

    const PlanCard = ({ plan, showChild = false }) => {
        const isPECS = plan.type === 'PECS';
        const isTEACCH = plan.type === 'TEACCH';
        const isActivity = plan.type === 'Activity';
        const isSkillTracker = plan.type === 'SkillTracker';
        const isExpanded = expandedPlanId === plan._id;
        const items = plan.content?.items || [];
        const goals = plan.content?.goals || [];
        const workSystem = plan.content?.workSystem || {};
        return (
            <div className="sp-plan-card">
                <div className="sp-plan-badge" style={{ background: badgeColor(plan.type) }}>
                    {planTypeLabel(plan.type)}
                </div>
                <h4 className="sp-plan-title">{plan.title}</h4>
                {showChild && plan.childId && (
                    <p className="sp-plan-child">
                        👶 {plan.childId.fullName || t('specialistDashboard.sidebar.title')}
                    </p>
                )}
                {plan.content?.phaseName && (
                    <p className="sp-plan-child">📊 {plan.content.phaseName}</p>
                )}
                <p className="sp-plan-date">
                    {new Date(plan.createdAt).toLocaleDateString()}
                </p>
                {isPECS && items.length > 0 && (
                    <>
                        <button
                            type="button"
                            className="sp-btn-view-board"
                            onClick={() => setExpandedPlanId(isExpanded ? null : plan._id)}
                        >
                            {isExpanded ? '▼ Hide board' : '▶ View board & trials'}
                        </button>
                        {isExpanded && (
                            <div className="sp-pecs-board-detail">
                                <div className="sp-pecs-trial-legend">
                                    <span><span className="sp-pecs-trial-dot pass">✓</span> Pass</span>
                                    <span><span className="sp-pecs-trial-dot fail">✗</span> Fail</span>
                                    <span><span className="sp-pecs-trial-dot empty">·</span> Not tested</span>
                                </div>
                                <div className="sp-pecs-detail-cards">
                                    {items.map((item) => {
                                        const rawTrials = item.trials || [];
                                        const trials = [...rawTrials];
                                        while (trials.length < 10) trials.push(null);
                                        const passCount = trials.filter(tr => tr === 'pass').length;
                                        const isMastered = passCount >= 8;
                                        return (
                                            <div key={item.id || item.label} className="sp-pecs-detail-card">
                                                <img src={getUploadUrl(item.imageUrl) || item.imageUrl} alt={item.label} onError={(e) => { e.target.src = `https://via.placeholder.com/80?text=${encodeURIComponent(item.label || '')}`; }} />
                                                <span className="sp-pecs-detail-label">{item.label}</span>
                                                <div className="sp-pecs-detail-trials" aria-label={`Trial results for ${item.label}`}>
                                                    {trials.slice(0, 10).map((t, i) => (
                                                        <span key={i} className={`sp-pecs-trial-dot ${t === 'pass' ? 'pass' : t === 'fail' ? 'fail' : 'empty'}`} title={`Trial ${i + 1}: ${t === 'pass' ? 'Pass' : t === 'fail' ? 'Fail' : 'Not tested'}`}>
                                                            {t === 'pass' ? '✓' : t === 'fail' ? '✗' : '·'}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className={`sp-pecs-detail-mastery ${isMastered ? 'mastered' : ''}`}>
                                                    {passCount}/10 {isMastered && '🏆'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
                {isTEACCH && (goals.length > 0 || workSystem.whatToDo) && (
                    <>
                        <button
                            type="button"
                            className="sp-btn-view-board"
                            onClick={() => setExpandedPlanId(isExpanded ? null : plan._id)}
                        >
                            {isExpanded ? '▼ Hide details' : '▶ View goals & work system'}
                        </button>
                        {isExpanded && (
                            <div className="sp-teacch-detail">
                                {workSystem.whatToDo && (
                                    <div className="sp-teacch-work-system">
                                        <h4>Work System</h4>
                                        <p><strong>What to do:</strong> {workSystem.whatToDo}</p>
                                        <p><strong>How much:</strong> {workSystem.howMuch}</p>
                                        <p><strong>When done:</strong> {workSystem.whenDone}</p>
                                        <p><strong>What next:</strong> {workSystem.whatNext}</p>
                                    </div>
                                )}
                                {goals.length > 0 && (
                                    <div className="sp-teacch-goals">
                                        <h4>Goals</h4>
                                        {goals.map((g, i) => {
                                            const progress = ((g.current - g.baseline) / (g.target - g.baseline) * 100) || 0;
                                            return (
                                                <div key={g.id || i} className="sp-teacch-goal-row">
                                                    <span className="sp-teacch-goal-text">{g.text}</span>
                                                    <div className="sp-teacch-goal-bar-wrap">
                                                        <div className="goal-progress-bar">
                                                            <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                                                        </div>
                                                        <span className="sp-teacch-goal-pct">{g.current ?? g.baseline}% → {g.target}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
                {isActivity && (plan.content?.description || plan.content?.dueDate) && (
                    <div className="sp-plan-activity-desc-wrap">
                        {plan.content.description && <p className="sp-plan-activity-desc">{plan.content.description}</p>}
                        {plan.content?.dueDate && <p className="sp-plan-activity-due">Due: {plan.content.dueDate}</p>}
                        {plan.content?.status && <span className={`sp-plan-activity-status status-${plan.content.status}`}>{plan.content.status}</span>}
                    </div>
                )}
                {isSkillTracker && plan.content && (
                    <div className="sp-skill-summary">
                        <span>{plan.content.successCount ?? 0}/10 trials</span>
                        {plan.content.isMastered && <span className="mastered">🏆 Mastered</span>}
                        {(plan.content.baselinePercent != null || plan.content.targetPercent != null) && (
                            <div className="sp-skill-progress-wrap">
                                <div className="goal-progress-bar">
                                    <div
                                        className="progress-fill skill-fill"
                                        style={{
                                            width: `${Math.min(100, Math.max(0, plan.content.currentPercent ?? (plan.content.successCount ?? 0) * 10))}%`
                                        }}
                                    />
                                </div>
                                <span className="sp-skill-pct">
                                    {plan.content.baselinePercent ?? 0}% → {plan.content.targetPercent ?? 80}% (current: {plan.content.currentPercent ?? (plan.content.successCount ?? 0) * 10}%)
                                </span>
                            </div>
                        )}
                    </div>
                )}
                <div className="sp-plan-actions">
                    <button className="sp-btn-delete" onClick={() => handleDeletePlan(plan._id)}>
                        🗑️ {t('specialistDashboard.planCard.delete')}
                    </button>
                </div>
            </div>
        );
    };

    // ── Sidebar Child List ──
    const ChildList = ({ children, label }) => (
        <>
            {label && <div className="sp-section-divider">{label}</div>}
            {children.map(child => (
                <div
                    key={child._id}
                    className={`sp-child-item ${selectedChild?._id === child._id ? 'active' : ''}`}
                    onClick={() => handleChildSelect(child)}
                >
                    <div className="sp-child-avatar">
                        {child.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div className="sp-child-info">
                        <strong>{child.fullName}</strong>
                        <span>
                            {child.gender === 'male' ? t('specialistDashboard.modal.male') : child.gender === 'female' ? t('specialistDashboard.modal.female') : t('specialistDashboard.modal.other')}
                            • {child.dateOfBirth ? new Date(child.dateOfBirth).getFullYear() : '?'}
                            {child._source === 'private' && ` • 🔒 ${t('specialistDashboard.childDetail.privatePatient')}`}
                        </span>
                    </div>
                </div>
            ))}
        </>
    );

    return (
        <div className="org-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="dashboard-title">{t('specialistDashboard.title')}</h1>
                        <p className="dashboard-subtitle">
                            {user.fullName} • {t(`specialistDashboard.roles.${user.role}`) || user.role}
                        </p>
                    </div>
                    <div className="header-right">
                        <LanguageSwitcher />
                        <button className="logout-button" onClick={handleLogout}>
                            {t('orgDashboard.header.logout')}
                        </button>
                    </div>
                </div>
            </header>

            {successMessage && <div className="success-banner">✅ {successMessage}</div>}
            {error && <div className="error-banner">❌ {error}</div>}

            <main className="dashboard-main">
                <div className="dashboard-tabs">
                    <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        📊 {t('specialistDashboard.tabs.overview')}
                    </button>
                    <button className={`tab ${activeTab === 'children' ? 'active' : ''}`} onClick={() => setActiveTab('children')}>
                        👶 {t('specialistDashboard.tabs.children')} ({allChildren.length})
                    </button>
                    <button className={`tab ${activeTab === 'myplans' ? 'active' : ''}`} onClick={() => setActiveTab('myplans')}>
                        📋 {t('specialistDashboard.tabs.myPlans')} ({totalPlans})
                    </button>
                </div>

                <div className="tab-content">

                    {/* ═══ OVERVIEW TAB ═══ */}
                    {activeTab === 'overview' && (
                        <div className="sp-overview">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">🏢</div>
                                    <div className="stat-info">
                                        <h3>{orgChildren.length}</h3>
                                        <p>{t('specialistDashboard.stats.orgChildren')}</p>
                                        <span className="stat-subtitle">{t('specialistDashboard.stats.orgChildrenDesc')}</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🔒</div>
                                    <div className="stat-info">
                                        <h3>{privateChildren.length}</h3>
                                        <p>{t('specialistDashboard.stats.privatePatients')}</p>
                                        <span className="stat-subtitle">{t('specialistDashboard.stats.privatePatientsDesc')}</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🖼️</div>
                                    <div className="stat-info">
                                        <h3>{pecsCount}</h3>
                                        <p>{t('specialistDashboard.stats.pecsBoards')}</p>
                                        <span className="stat-subtitle">{t('specialistDashboard.stats.pecsBoardsDesc')}</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🎯</div>
                                    <div className="stat-info">
                                        <h3>{teacchCount}</h3>
                                        <p>{t('specialistDashboard.stats.teacchTrackers')}</p>
                                        <span className="stat-subtitle">{t('specialistDashboard.stats.teacchTrackersDesc')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="sp-section">
                                <h2 className="sp-section-title">{t('specialistDashboard.quickActions.title')}</h2>
                                <div className="sp-quick-actions">
                                    <button className="sp-action-card" onClick={() => {
                                        setFamilyModalMode('create');
                                        setShowAddFamilyModal(true);
                                    }}>
                                        <span className="sp-action-icon">➕</span>
                                        <span className="sp-action-label">{t('specialistDashboard.quickActions.addPrivateFamily')}</span>
                                        <span className="sp-action-desc">{t('specialistDashboard.quickActions.addPrivateFamilyDesc')}</span>
                                    </button>
                                    <button className="sp-action-card" onClick={() => setActiveTab('children')}>
                                        <span className="sp-action-icon">👶</span>
                                        <span className="sp-action-label">{t('specialistDashboard.quickActions.viewChildren')}</span>
                                        <span className="sp-action-desc">{t('specialistDashboard.quickActions.viewChildrenDesc')}</span>
                                    </button>
                                    <button className="sp-action-card" onClick={() => setActiveTab('myplans')}>
                                        <span className="sp-action-icon">📋</span>
                                        <span className="sp-action-label">{t('specialistDashboard.quickActions.myPlans')}</span>
                                        <span className="sp-action-desc">{t('specialistDashboard.quickActions.myPlansDesc')}</span>
                                    </button>
                                </div>
                            </div>

                            {allChildren.length === 0 && (
                                <div className="sp-tip-banner">
                                    <div className="sp-tip-icon">💡</div>
                                    <div>
                                        <strong>{t('specialistDashboard.gettingStarted')}</strong>
                                        <p>{t('specialistDashboard.noChildrenTip')}</p>
                                    </div>
                                </div>
                            )}

                            {myPlans.length > 0 && (
                                <div className="sp-section">
                                    <h2 className="sp-section-title">{t('specialistDashboard.recentPlans')}</h2>
                                    <div className="sp-plans-grid">
                                        {myPlans.slice(0, 6).map(plan => (
                                            <PlanCard key={plan._id} plan={plan} showChild={true} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ CHILDREN TAB ═══ */}
                    {activeTab === 'children' && (
                        <div className="sp-children-layout">
                            <aside className="sp-sidebar">
                                <div className="sp-sidebar-header">
                                    <h3>{t('specialistDashboard.sidebar.title')} ({allChildren.length})</h3>
                                </div>
                                <div className="sp-children-list">
                                    {allChildren.length === 0 ? (
                                        <div className="sp-empty-sidebar">
                                            <p>😔 {t('specialistDashboard.sidebar.noChildren')}</p>
                                            <small>{t('specialistDashboard.sidebar.noChildrenSub')}</small>
                                        </div>
                                    ) : (
                                        <>
                                            {orgChildren.length > 0 && (
                                                <ChildList children={orgChildren} label={`🏢 ${t('specialistDashboard.sidebar.organization')}`} />
                                            )}
                                            {privateChildren.length > 0 && (
                                                <ChildList children={privateChildren} label={`🔒 ${t('specialistDashboard.sidebar.privatePatients')}`} />
                                            )}
                                        </>
                                    )}
                                </div>
                                <button className="sp-add-child-btn" onClick={() => {
                                    setFamilyModalMode('create');
                                    setShowAddFamilyModal(true);
                                }}>
                                    ➕ {t('specialistDashboard.sidebar.addPrivateFamily')}
                                </button>
                            </aside>

                            <section className="sp-child-detail">
                                {selectedChild ? (
                                    <>
                                        <div className="sp-child-header">
                                            <div className="sp-child-avatar-large">
                                                {selectedChild.fullName?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <h2>{selectedChild.fullName}</h2>
                                                <p>
                                                    {selectedChild.gender === 'male' ? t('specialistDashboard.modal.male') : selectedChild.gender === 'female' ? t('specialistDashboard.modal.female') : t('specialistDashboard.modal.other')}
                                                    • {selectedChild.dateOfBirth ? new Date(selectedChild.dateOfBirth).toLocaleDateString() : 'N/A'}
                                                    {selectedChild._source === 'private' && ` • 🔒 ${t('specialistDashboard.childDetail.privatePatient')}`}
                                                </p>
                                                {selectedChild.diagnosis && (
                                                    <p>📋 {selectedChild.diagnosis}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sp-action-buttons">
                                            <button className="sp-btn sp-btn-pecs" onClick={() => navigate(`/specialist/pecs/create?childId=${selectedChild._id}`)}>
                                                🖼️ {t('specialistDashboard.childDetail.createPecs')}
                                            </button>
                                            <button className="sp-btn sp-btn-teacch" onClick={() => navigate(`/specialist/teacch/create?childId=${selectedChild._id}`)}>
                                                🎯 {t('specialistDashboard.childDetail.startTeacch')}
                                            </button>
                                            <button className="sp-btn sp-btn-skill" onClick={() => navigate(`/specialist/skill-tracker?childId=${selectedChild._id}`)}>
                                                📊 {t('specialistDashboard.childDetail.skillTracker')}
                                            </button>
                                            <button className="sp-btn sp-btn-games" onClick={() => navigate(`/specialist/activities?childId=${selectedChild._id}`)}>
                                                🎮 {t('specialistDashboard.childDetail.assignGames')}
                                            </button>
                                        </div>

                                        <div className="sp-section">
                                            <h3 className="sp-section-title">{t('specialistDashboard.childDetail.activePlans')} {selectedChild.fullName}</h3>
                                            <div className="sp-plan-filter">
                                                <span className="sp-filter-label">Filter:</span>
                                                {['all', 'PECS', 'TEACCH', 'SkillTracker', 'Activity'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        className={`sp-filter-btn ${planTypeFilter === type ? 'active' : ''}`}
                                                        onClick={() => setPlanTypeFilter(type)}
                                                    >
                                                        {type === 'all' ? 'All' : type === 'SkillTracker' ? 'Skill' : type === 'Activity' ? 'Activity' : type}
                                                    </button>
                                                ))}
                                            </div>
                                            {filteredChildPlans.length === 0 ? (
                                                <div className="sp-empty-state">
                                                    <div className="sp-empty-icon">📝</div>
                                                    <h3>{planTypeFilter === 'all' ? t('specialistDashboard.childDetail.noPlans') : `No ${planTypeFilter} plans`}</h3>
                                                    <p>{planTypeFilter === 'all' ? t('specialistDashboard.childDetail.noPlansSub') : `Try "All" or create a ${planTypeFilter} plan.`}</p>
                                                </div>
                                            ) : (
                                                <div className="sp-plans-grid">
                                                    {filteredChildPlans.map(plan => (
                                                        <PlanCard key={plan._id} plan={plan} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="sp-empty-state">
                                        <div className="sp-empty-icon">👈</div>
                                        <h3>{t('specialistDashboard.childDetail.selectChild')}</h3>
                                        <p>{t('specialistDashboard.childDetail.selectChildSub')}</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {/* ═══ MY PLANS TAB ═══ */}
                    {activeTab === 'myplans' && (
                        <div className="sp-my-plans">
                            <div className="sp-section-header">
                                <h2 className="sp-section-title">{t('specialistDashboard.myPlansTab.title')} ({myPlans.length})</h2>
                                <button className="refresh-button" onClick={fetchMyPlans}>
                                    🔄 {t('specialistDashboard.myPlansTab.refresh')}
                                </button>
                            </div>
                            <div className="sp-plan-filter">
                                <span className="sp-filter-label">Filter:</span>
                                {['all', 'PECS', 'TEACCH', 'SkillTracker', 'Activity'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        className={`sp-filter-btn ${planTypeFilter === type ? 'active' : ''}`}
                                        onClick={() => setPlanTypeFilter(type)}
                                    >
                                        {type === 'all' ? 'All' : type === 'SkillTracker' ? 'Skill' : type === 'Activity' ? 'Activity' : type}
                                    </button>
                                ))}
                            </div>
                            {filteredMyPlans.length === 0 ? (
                                <div className="sp-empty-state">
                                    <div className="sp-empty-icon">📋</div>
                                    <h3>{planTypeFilter === 'all' ? t('specialistDashboard.myPlansTab.noPlans') : `No ${planTypeFilter} plans`}</h3>
                                    <p>{planTypeFilter === 'all' ? t('specialistDashboard.myPlansTab.noPlansSub') : `Try "All" or create a ${planTypeFilter} plan.`}</p>
                                    {planTypeFilter !== 'all' && (
                                        <button className="sp-btn sp-btn-pecs" onClick={() => setPlanTypeFilter('all')} style={{ marginTop: '1rem' }}>Show all</button>
                                    )}
                                    {planTypeFilter === 'all' && (
                                        <button className="sp-btn sp-btn-pecs" onClick={() => setActiveTab('children')} style={{ marginTop: '1rem' }}>
                                            👶 {t('specialistDashboard.myPlansTab.goToChildren')}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="sp-plans-grid">
                                    {filteredMyPlans.map(plan => (
                                        <PlanCard key={plan._id} plan={plan} showChild={true} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* ═══ ADD FAMILY MODAL ═══ */}
            {showAddFamilyModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowAddFamilyModal(false);
                    setFamilyModalMode('add');
                    setEditingFamily(null);
                    setExistingChildren([]);
                    setChildrenToDelete([]);
                }}>
                    <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{familyModalMode === 'edit' ? t('orgDashboard.families.editTitle') : (familyModalMode === 'create' ? t('orgDashboard.families.createNew') : t('orgDashboard.families.addExisting'))}</h2>
                            <button className="modal-close" onClick={() => {
                                setShowAddFamilyModal(false);
                                setFamilyModalMode('add');
                                setEditingFamily(null);
                                setExistingChildren([]);
                                setChildrenToDelete([]);
                            }}>×</button>
                        </div>

                        {/* Mode Selector */}
                        {familyModalMode !== 'edit' && (
                            <div className="mode-selector">
                                <button type="button" className={`mode-button ${familyModalMode === 'add' ? 'active' : ''}`} onClick={() => setFamilyModalMode('add')}>
                                    {t('orgDashboard.families.addExisting')}
                                </button>
                                <button type="button" className={`mode-button ${familyModalMode === 'create' ? 'active' : ''}`} onClick={() => setFamilyModalMode('create')}>
                                    {t('orgDashboard.families.createNew')}
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleAddFamily} className="modal-form">
                            {familyModalMode === 'add' ? (
                                <div className="form-group">
                                    <label>{t('orgDashboard.families.email')}</label>
                                    <input type="email" value={familyEmail} onChange={(e) => setFamilyEmail(e.target.value)} placeholder="parent@example.com" required />
                                    <small className="form-help">{t('orgDashboard.modal.emailHelp')}</small>
                                </div>
                            ) : (
                                <>
                                    <h3 className="section-title">{t('orgDashboard.modal.parentInfo')}</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('orgDashboard.modal.fullName')} *</label>
                                            <input type="text" value={newFamily.fullName} onChange={(e) => setNewFamily({ ...newFamily, fullName: e.target.value })} placeholder={t('orgDashboard.modal.fullNamePlaceholder')} required />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('orgDashboard.modal.email')} *</label>
                                            <input type="email" value={newFamily.email} onChange={(e) => setNewFamily({ ...newFamily, email: e.target.value })} placeholder={t('orgDashboard.modal.emailPlaceholder')} required />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('orgDashboard.modal.phone')}</label>
                                            <input type="tel" value={newFamily.phone} onChange={(e) => setNewFamily({ ...newFamily, phone: e.target.value })} placeholder="+1234567890" />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('orgDashboard.modal.password')} *</label>
                                            <input type="password" value={newFamily.password} onChange={(e) => setNewFamily({ ...newFamily, password: e.target.value })} placeholder="Min. 6 chars" minLength="6" required />
                                        </div>
                                    </div>

                                    <div className="children-section">
                                        <div className="section-header">
                                            <h3 className="section-title">{t('orgDashboard.modal.childrenOptional')}</h3>
                                            <button type="button" className="add-child-button" onClick={handleAddChildField}>+ {t('orgDashboard.modal.addChild')}</button>
                                        </div>
                                        {newFamily.children.map((child, index) => (
                                            <div key={index} className="child-form">
                                                <div className="child-header">
                                                    <h4>Child #{index + 1}</h4>
                                                    <button type="button" className="remove-child-button" onClick={() => handleRemoveChildField(index)}>{t('orgDashboard.modal.remove')}</button>
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>{t('orgDashboard.modal.fullName')} *</label>
                                                        <input type="text" value={child.fullName} onChange={(e) => handleChildFieldChange(index, 'fullName', e.target.value)} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>{t('orgDashboard.modal.dob')} *</label>
                                                        <input type="date" value={child.dateOfBirth} onChange={(e) => handleChildFieldChange(index, 'dateOfBirth', e.target.value)} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>{t('orgDashboard.modal.gender')} *</label>
                                                        <select value={child.gender} onChange={(e) => handleChildFieldChange(index, 'gender', e.target.value)} required>
                                                            <option value="male">{t('orgDashboard.modal.male')}</option>
                                                            <option value="female">{t('orgDashboard.modal.female')}</option>
                                                            <option value="other">{t('orgDashboard.modal.other')}</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>{t('orgDashboard.modal.diagnosis')}</label>
                                                    <input type="text" value={child.diagnosis} onChange={(e) => handleChildFieldChange(index, 'diagnosis', e.target.value)} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            <div className="modal-footer">
                                <button type="button" className="modal-btn-secondary" onClick={() => setShowAddFamilyModal(false)}>{t('orgDashboard.modal.cancel')}</button>
                                <button type="submit" className="modal-btn-primary" disabled={addChildLoading}>
                                    {addChildLoading ? t('orgDashboard.modal.saving') : (familyModalMode === 'add' ? t('orgDashboard.families.addExisting') : t('orgDashboard.families.createNew'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SpecialistDashboard;
