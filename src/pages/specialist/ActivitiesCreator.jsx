import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config';
import './SpecialistDashboard.css';

function ActivitiesCreator() {
    const [searchParams] = useSearchParams();
    const childId = searchParams.get('childId');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [childName, setChildName] = useState('Loading...');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
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
                type: 'Activity',
                title,
                content: { description, boardData: {} }
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
                throw new Error(errData.message || 'Failed to save activity');
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
                <div className="dashboard-nav">
                    <div className="nav-brand">
                        <img src="/src/assets/logo.png" alt="Logo" className="nav-logo" />
                        <div className="brand-info">
                            <h1>Assign Activity/Game</h1>
                            <p>For {childName}</p>
                        </div>
                    </div>
                    <div className="nav-actions">
                        <button className="logout-button" onClick={() => navigate('/specialist/dashboard')}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div className="pecs-creator-container" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h2>Create New Activity</h2>
                    {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                    <form onSubmit={handleSave}>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Activity Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Identifying Emotions Game"
                                required
                                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Description & Instructions</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the activity or game..."
                                rows={4}
                                required
                                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div className="creator-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button type="submit" className="save-btn" disabled={loading} style={{ backgroundColor: '#10b981', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {loading ? 'Saving...' : 'Save Activity'}
                            </button>
                            <button type="button" className="cancel-btn" onClick={() => navigate('/specialist/dashboard')} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default ActivitiesCreator;
