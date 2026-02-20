import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Grainient from '../../components/Grainient';
import { API_BASE_URL } from '../../config';
import './SpecialistDashboard.css';

const PECS_PHASES = [
    {
        id: 1,
        name: 'Phase I – Physical Exchange',
        description: 'The child learns to exchange a single picture for a highly desired item.',
        criteria: 'Child independently exchanges a picture with minimal prompting in 8/10 trials.',
        tips: 'Use highly motivating items. Two adults recommended: one as communication partner, one as physical prompter.'
    },
    {
        id: 2,
        name: 'Phase II – Distance & Persistence',
        description: 'The child travels to the communication partner and uses the picture across various settings.',
        criteria: 'Child travels to book, selects picture, and approaches partner independently.',
        tips: 'Gradually increase distance between child, book, and partner. Practice in different rooms/settings.'
    },
    {
        id: 3,
        name: 'Phase III – Picture Discrimination',
        description: 'The child discriminates between two or more pictures to select the one they want.',
        criteria: 'Child consistently selects the correct picture from an array of 5+ pictures in 8/10 trials.',
        tips: 'Start with preferred vs. non-preferred items, then move to preferred vs. preferred.'
    },
    {
        id: 4,
        name: 'Phase IV – Sentence Structure',
        description: 'The child constructs simple sentences using an "I want" card + the desired item picture.',
        criteria: 'Child independently constructs "I want + [item]" sentence strips.',
        tips: 'Introduce the "I want" icon. The child places it on the strip, then adds the item picture.'
    },
    {
        id: 5,
        name: 'Phase V – Responsive Requesting',
        description: 'The child uses PECS to answer "What do you want?" questions.',
        criteria: 'Child responds to "What do you want?" by constructing a sentence strip within 5 seconds.',
        tips: 'Begin with a delay between question and prompting. Fade prompts over time.'
    },
    {
        id: 6,
        name: 'Phase VI – Commenting',
        description: 'The child spontaneously comments on their environment ("I see…", "I hear…", "It is a…").',
        criteria: 'Child spontaneously comments using sentence starters in natural situations.',
        tips: 'Introduce sentence starters: "I see", "I hear", "I have". Encourage commenting about novel items.'
    }
];

function PECSBoardCreator() {
    const [searchParams] = useSearchParams();
    const childId = searchParams.get('childId');
    const [title, setTitle] = useState('');
    const [selectedPhase, setSelectedPhase] = useState(1);
    const [items, setItems] = useState([]);
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemImage, setNewItemImage] = useState('');
    const [trials, setTrials] = useState(Array(10).fill(null)); // null | 'pass' | 'fail'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();
    const token = localStorage.getItem('specialistToken');

    const currentPhase = PECS_PHASES.find(p => p.id === selectedPhase);
    const successCount = trials.filter(t => t === 'pass').length;
    const isMastered = successCount >= 8;

    const addItem = () => {
        if (!newItemLabel) return;
        setItems([...items, {
            id: Date.now().toString(),
            label: newItemLabel,
            imageUrl: newItemImage || `https://via.placeholder.com/120?text=${encodeURIComponent(newItemLabel)}`
        }]);
        setNewItemLabel('');
        setNewItemImage('');
    };

    const removeItem = (id) => setItems(items.filter(item => item.id !== id));

    const toggleTrial = (index) => {
        const newTrials = [...trials];
        if (newTrials[index] === null) newTrials[index] = 'pass';
        else if (newTrials[index] === 'pass') newTrials[index] = 'fail';
        else newTrials[index] = null;
        setTrials(newTrials);
    };

    const handleSave = async () => {
        if (!title || items.length === 0) {
            setError('Please provide a title and at least one picture card.');
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
                    type: 'PECS',
                    title,
                    content: {
                        phase: selectedPhase,
                        phaseName: currentPhase.name,
                        items,
                        trials,
                        successCount,
                        isMastered,
                        criteria: currentPhase.criteria
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
        <div className="pecs-creator-page">
            <Grainient color1="#FF9FFC" color2="#5227FF" color3="#B19EEF" timeSpeed={0.25} warpStrength={0.5} />

            <div className="creator-content">
                <header className="creator-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                    <h1>🖼️ PECS Board Creator</h1>
                    <button className="save-btn" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : '💾 Save Board'}
                    </button>
                </header>

                {error && <div className="error-message">{error}</div>}

                <div className="creator-main">
                    {/* Left: Settings */}
                    <div className="settings-panel">
                        <div className="form-group">
                            <label>Board Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Morning Routine Board"
                            />
                        </div>

                        {/* Phase Selector */}
                        <div className="form-group">
                            <label>PECS Phase</label>
                            <select value={selectedPhase} onChange={(e) => setSelectedPhase(Number(e.target.value))}>
                                {PECS_PHASES.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Phase Info Card */}
                        {currentPhase && (
                            <div className="phase-info-card">
                                <h4>{currentPhase.name}</h4>
                                <p>{currentPhase.description}</p>
                                <div className="phase-detail">
                                    <strong>📋 Mastery Criteria:</strong>
                                    <span>{currentPhase.criteria}</span>
                                </div>
                                <div className="phase-detail">
                                    <strong>💡 Tips:</strong>
                                    <span>{currentPhase.tips}</span>
                                </div>
                            </div>
                        )}

                        {/* Add Card */}
                        <div className="add-item-box">
                            <h3>Add Picture Card</h3>
                            <div className="form-group">
                                <label>Label</label>
                                <input type="text" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} placeholder="e.g., Apple" />
                            </div>
                            <div className="form-group">
                                <label>Image URL (Optional)</label>
                                <input type="text" value={newItemImage} onChange={(e) => setNewItemImage(e.target.value)} placeholder="https://..." />
                            </div>
                            <button className="add-btn" onClick={addItem}>+ Add to Board</button>
                        </div>
                    </div>

                    {/* Right: Board Preview + Trials */}
                    <div className="board-preview">
                        <h3>Communication Board ({items.length} cards)</h3>
                        <div className="pecs-grid">
                            {items.map(item => (
                                <div key={item.id} className="pecs-card">
                                    <img src={item.imageUrl} alt={item.label} />
                                    <span>{item.label}</span>
                                    <button className="remove-card" onClick={() => removeItem(item.id)}>×</button>
                                </div>
                            ))}
                            {items.length === 0 && <p className="empty-preview">Add picture cards from the left panel to build the board.</p>}
                        </div>

                        {/* Trial Grid */}
                        <div className="trial-section">
                            <h3>Trial Data (10 Trials)</h3>
                            <p className="trial-desc">Click each trial to toggle: ⬜ Not tested → ✅ Pass → ❌ Fail</p>
                            <div className="trial-grid">
                                {trials.map((trial, i) => (
                                    <button
                                        key={i}
                                        className={`trial-cell ${trial || 'empty'}`}
                                        onClick={() => toggleTrial(i)}
                                    >
                                        {trial === 'pass' ? '✅' : trial === 'fail' ? '❌' : (i + 1)}
                                    </button>
                                ))}
                            </div>
                            <div className="trial-summary">
                                <span>Success: {successCount}/10</span>
                                <span className={`mastery-badge ${isMastered ? 'mastered' : ''}`}>
                                    {isMastered ? '🏆 Phase Mastered!' : `${8 - successCount} more needed for mastery`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PECSBoardCreator;
