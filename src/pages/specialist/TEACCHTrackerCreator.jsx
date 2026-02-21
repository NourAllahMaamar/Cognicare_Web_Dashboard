import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Grainient from '../../components/Grainient';
import { API_BASE_URL } from '../../config';
import './SpecialistDashboard.css';

const TEACCH_CATEGORIES = [
    { id: 'social_skills', label: 'Social Skills', icon: '🤝', color: '#6366f1' },
    { id: 'communication', label: 'Communication', icon: '💬', color: '#f59e0b' },
    { id: 'academics', label: 'Academics', icon: '📚', color: '#10b981' },
    { id: 'life_skills', label: 'Life Skills', icon: '🏠', color: '#ec4899' },
    { id: 'motor_skills', label: 'Motor Skills', icon: '💪', color: '#8b5cf6' },
];

const GOAL_TEMPLATES = {
    social_skills: [
        'Initiates eye contact with a peer for 3 seconds',
        'Takes turns during a game with minimal prompting',
        'Greets familiar adults independently',
        'Shares materials with peers during structured activities',
    ],
    communication: [
        'Points to desired item from a choice of 3',
        'Uses 2-word phrases to make requests',
        'Follows 2-step instructions without visual cue',
        'Labels common objects in the environment',
    ],
    academics: [
        'Matches identical objects or pictures',
        'Sorts items by color (3 colors)',
        'Identifies own name in print',
        'Counts objects up to 5 with 1:1 correspondence',
    ],
    life_skills: [
        'Washes hands with visual schedule independently',
        'Puts on/removes jacket independently',
        'Cleans up workspace when directed',
        'Uses utensils to eat independently',
    ],
    motor_skills: [
        'Holds a pencil with correct tripod grip',
        'Cuts along a straight line with scissors',
        'Stacks 5+ blocks in a tower',
        'Catches a ball from 3 feet away',
    ],
};

function TEACCHTrackerCreator() {
    const [searchParams] = useSearchParams();
    const childId = searchParams.get('childId');
    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('social_skills');
    const [goals, setGoals] = useState([]);
    const [newGoalText, setNewGoalText] = useState('');
    const [newGoalBaseline, setNewGoalBaseline] = useState(0);
    const [newGoalTarget, setNewGoalTarget] = useState(80);
    const [workSystem, setWorkSystem] = useState({
        whatToDo: '',
        howMuch: '',
        whenDone: '',
        whatNext: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();
    const token = localStorage.getItem('specialistToken');

    useEffect(() => {
        if (!token) {
            navigate('/specialist/login');
            return;
        }
        if (!childId) {
            setError(t('specialistDashboard.messages.childNotFound') || 'Please select a child from the dashboard first.');
        }
    }, [token, childId, navigate]);

    const currentCat = TEACCH_CATEGORIES.find(c => c.id === selectedCategory);

    const addGoal = (text) => {
        const goalText = (text || newGoalText).trim();
        if (!goalText) return;
        setGoals([...goals, {
            id: Date.now().toString(),
            text: goalText,
            category: selectedCategory,
            categoryLabel: currentCat?.label,
            baseline: newGoalBaseline,
            target: newGoalTarget,
            current: newGoalBaseline,
            measurement: 'Percentage of successful trials'
        }]);
        setNewGoalText('');
        setNewGoalBaseline(0);
        setNewGoalTarget(80);
    };

    const removeGoal = (id) => setGoals(goals.filter(g => g.id !== id));

    const handleSave = async () => {
        if (!childId) {
            setError(t('specialistDashboard.messages.childNotFound') || 'Please select a child from the dashboard first.');
            return;
        }
        if (!title || goals.length === 0) {
            setError('Please provide a title and at least one goal.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/specialized-plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    childId,
                    type: 'TEACCH',
                    title,
                    content: {
                        goals,
                        workSystem,
                        categories: [...new Set(goals.map(g => g.category))],
                    }
                })
            });
            if (response.ok) {
                navigate('/specialist/dashboard');
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to save');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="teacch-creator-page">
            <Grainient color1="#f59e0b" color2="#10b981" color3="#6366f1" timeSpeed={0.25} warpStrength={0.5} />

            <div className="creator-content">
                <header className="creator-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                    <h1>🎯 TEACCH Structured Teaching Tracker</h1>
                    <button className="save-btn" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : '💾 Save Tracker'}
                    </button>
                </header>

                {error && <div className="error-message">{error}</div>}

                <div className="creator-main">
                    {/* Left: Settings + Goals */}
                    <div className="settings-panel">
                        <div className="form-group">
                            <label>Tracker Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Week 5 Goals – Ahmed"
                            />
                        </div>

                        {/* Category Selector */}
                        <div className="form-group">
                            <label>Goal Category</label>
                            <div className="category-grid">
                                {TEACCH_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                                        style={{ '--cat-color': cat.color }}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Work System */}
                        <div className="work-system-box">
                            <h3>📋 Work System (Structured Teaching)</h3>
                            <p className="help-text">Define the 4 components of the TEACCH work system for this child.</p>
                            <div className="form-group">
                                <label>1. What to do?</label>
                                <input type="text" value={workSystem.whatToDo} onChange={(e) => setWorkSystem({ ...workSystem, whatToDo: e.target.value })} placeholder="e.g., Complete matching activity" />
                            </div>
                            <div className="form-group">
                                <label>2. How much?</label>
                                <input type="text" value={workSystem.howMuch} onChange={(e) => setWorkSystem({ ...workSystem, howMuch: e.target.value })} placeholder="e.g., 5 items" />
                            </div>
                            <div className="form-group">
                                <label>3. When am I done?</label>
                                <input type="text" value={workSystem.whenDone} onChange={(e) => setWorkSystem({ ...workSystem, whenDone: e.target.value })} placeholder="e.g., When all items are placed in the box" />
                            </div>
                            <div className="form-group">
                                <label>4. What comes next?</label>
                                <input type="text" value={workSystem.whatNext} onChange={(e) => setWorkSystem({ ...workSystem, whatNext: e.target.value })} placeholder="e.g., Free play time" />
                            </div>
                        </div>

                        {/* Add Goal */}
                        <div className="add-goal-box">
                            <h3>Add Goal</h3>

                            {/* Template Suggestions */}
                            <div className="template-list">
                                <label>Quick Templates:</label>
                                {GOAL_TEMPLATES[selectedCategory]?.map((tmpl, i) => (
                                    <button key={i} className="template-btn" onClick={() => addGoal(tmpl)}>
                                        + {tmpl}
                                    </button>
                                ))}
                            </div>

                            <div className="form-group">
                                <label>Custom Goal</label>
                                <textarea
                                    value={newGoalText}
                                    onChange={(e) => setNewGoalText(e.target.value)}
                                    placeholder="Describe the target behavior..."
                                    rows={2}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Baseline %</label>
                                    <input type="number" min={0} max={100} value={newGoalBaseline} onChange={(e) => setNewGoalBaseline(Number(e.target.value))} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Target %</label>
                                    <input type="number" min={0} max={100} value={newGoalTarget} onChange={(e) => setNewGoalTarget(Number(e.target.value))} />
                                </div>
                            </div>
                            <button className="add-btn" onClick={() => addGoal()}>+ Add Goal</button>
                        </div>
                    </div>

                    {/* Right: Goals Preview */}
                    <div className="board-preview">
                        <h3>Goals ({goals.length})</h3>
                        <div className="goals-list">
                            {goals.map(goal => {
                                const catInfo = TEACCH_CATEGORIES.find(c => c.id === goal.category);
                                const progress = ((goal.current - goal.baseline) / (goal.target - goal.baseline) * 100) || 0;
                                return (
                                    <div key={goal.id} className="goal-item-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="goal-category-tag" style={{ background: catInfo?.color }}>
                                                {catInfo?.icon} {catInfo?.label}
                                            </span>
                                            <button className="remove-goal" onClick={() => removeGoal(goal.id)}>🗑️</button>
                                        </div>
                                        <p className="goal-text">{goal.text}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                            <span>Baseline: {goal.baseline}%</span>
                                            <span>Target: {goal.target}%</span>
                                        </div>
                                        <div className="goal-progress-bar">
                                            <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {goals.length === 0 && (
                                <p className="empty-preview">
                                    Select a category and add goals using templates or custom text.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TEACCHTrackerCreator;
