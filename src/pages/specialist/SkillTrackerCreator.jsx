import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config';
import './SpecialistDashboard.css';

function SkillTrackerCreator() {
    const [searchParams] = useSearchParams();
    const childId = searchParams.get('childId');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [childName, setChildName] = useState('Loading...');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [trials, setTrials] = useState(Array(10).fill('pending')); // 'pending', 'passed', 'failed'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('specialistToken');

    useEffect(() => {
        if (!token) {
            navigate('/specialist/login');
            return;
        }

        const fetchChildDetails = async () => {
            try {
                const [orgRes, privateRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/organization/my-organization/children`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/children/specialist/my-children`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                const orgChildren = orgRes.ok ? await orgRes.json() : [];
                const privateChildren = privateRes.ok ? await privateRes.json() : [];
                const allChildren = [...(Array.isArray(orgChildren) ? orgChildren : []), ...(Array.isArray(privateChildren) ? privateChildren : [])];
                const targetChild = allChildren.find(c => c._id === childId);
                if (targetChild) {
                    setChildName(targetChild.fullName);
                    setError('');
                } else {
                    setChildName('Unknown Child');
                    setError(t('specialistDashboard.messages.childNotFound') || 'Child not found.');
                }
            } catch (err) {
                console.error("Error fetching child details:", err);
                setChildName('Unknown Child');
                setError(t('specialistDashboard.messages.fetchError') || 'Failed to load child.');
            }
        };

        if (childId) {
            fetchChildDetails();
        }
    }, [childId, token, navigate]);

    const handleTrialChange = (index, status) => {
        const newTrials = [...trials];
        newTrials[index] = status;
        setTrials(newTrials);
    };

    const getSuccessCount = () => {
        return trials.filter(tr => tr === 'passed').length;
    };

    const isMastered = getSuccessCount() >= 8;

    const handleSave = async (e) => {
        e.preventDefault();
        if (!childId) {
            setError(t('specialistDashboard.messages.childNotFound') || 'Please select a child from the dashboard first.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const planData = {
                childId,
                type: 'SkillTracker',
                title,
                content: {
                    subType: 'SkillTracker',
                    description,
                    trials,
                    isMastered,
                    successCount: getSuccessCount()
                }
            };

            const response = await fetch(`${API_BASE_URL}/specialized-plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(planData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to save skill tracker');
            }

            navigate('/specialist/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="org-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="dashboard-title">
                            <img src="/src/assets/logo.png" alt="Logo" className="header-logo" />
                            Skill Mastery Tracker
                        </h1>
                        <p className="dashboard-subtitle">For {childName}</p>
                    </div>
                    <div className="header-right">
                        <button className="logout-button" onClick={() => navigate('/specialist/dashboard')}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
                <div className="pecs-creator-container" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '2rem' }}>
                        <h2 style={{ color: '#1e293b', margin: 0 }}>Discrete Trial Training</h2>
                        <div style={{ background: isMastered ? '#dcfce7' : '#f1f5f9', color: isMastered ? '#166534' : '#64748b', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold' }}>
                            {getSuccessCount()} / 10 | Status: {isMastered ? 'Mastered 🏆' : 'Learning'}
                        </div>
                    </div>

                    {error && <div className="error-message" style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Core Skill / Target</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Selecting 'I Want' icon consistently"
                                    required
                                    style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Criteria & Notes</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Prompting level, environment, specific materials..."
                                    rows={2}
                                    style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ marginTop: 0, color: '#334155', marginBottom: '1.5rem', textAlign: 'center' }}>10-Trial Mastery Grid (8/10 Rule)</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                                {trials.map((status, index) => (
                                    <div key={index} style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ fontWeight: 'bold', color: '#94a3b8' }}>Trial {index + 1}</div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleTrialChange(index, 'passed')}
                                                style={{
                                                    background: status === 'passed' ? '#22c55e' : '#f1f5f9',
                                                    color: status === 'passed' ? 'white' : '#64748b',
                                                    border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                                                }}
                                            >✓</button>
                                            <button
                                                type="button"
                                                onClick={() => handleTrialChange(index, 'failed')}
                                                style={{
                                                    background: status === 'failed' ? '#ef4444' : '#f1f5f9',
                                                    color: status === 'failed' ? 'white' : '#64748b',
                                                    border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                                                }}
                                            >✗</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="creator-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                            <button type="button" className="cancel-btn" onClick={() => navigate('/specialist/dashboard')} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.875rem 2rem', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                Cancel
                            </button>
                            <button type="submit" className="save-btn" disabled={loading} style={{ backgroundColor: '#6366f1', color: 'white', padding: '0.875rem 2rem', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                                {loading ? 'Saving Tracker...' : 'Save Tracker'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default SkillTrackerCreator;
