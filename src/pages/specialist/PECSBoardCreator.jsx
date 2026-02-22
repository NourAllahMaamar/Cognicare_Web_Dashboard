import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, getUploadUrl } from '../../config';
import pecsHeaderImg from '../../assets/pecs-header.png';
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

const TRIALS_PER_CARD = 10;
const MASTERY_THRESHOLD = 8;

function PECSBoardCreator() {
    const [searchParams] = useSearchParams();
    const childId = searchParams.get('childId');
    const [title, setTitle] = useState('');
    const [selectedPhase, setSelectedPhase] = useState(1);
    const [items, setItems] = useState([]); // each: { id, label, imageUrl, trials: [null|'pass'|'fail'] }
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemImage, setNewItemImage] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();
    const token = localStorage.getItem('specialistToken');

    useEffect(() => {
        if (!token) {
            navigate('/specialist/login');
            return;
        }
        if (!childId) {
            setError('Please select a child from the dashboard first.');
        }
    }, [token, childId, navigate]);

    const currentPhase = PECS_PHASES.find(p => p.id === selectedPhase);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (JPEG, PNG, or WebP).');
            return;
        }
        setUploadingImage(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${API_BASE_URL}/specialized-plans/upload-image`, {
                method: 'POST',
                headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
                credentials: 'include',
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Upload failed');
            }
            const { imageUrl } = await res.json();
            setNewItemImage(imageUrl);
            setSuccessMessage('Image uploaded. Click "Add to Board" to use it.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message || 'Image upload failed. Try a URL or check backend Cloudinary config.');
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const addItem = () => {
        if (!newItemLabel) return;
        setError('');
        const imageSrc = newItemImage || `https://via.placeholder.com/120?text=${encodeURIComponent(newItemLabel)}`;
        setItems([...items, {
            id: Date.now().toString(),
            label: newItemLabel,
            imageUrl: imageSrc,
            trials: Array(TRIALS_PER_CARD).fill(null),
        }]);
        setNewItemLabel('');
        setNewItemImage('');
    };

    const removeItem = (id) => setItems(items.filter(item => item.id !== id));

    const toggleTrial = (itemId, index) => {
        setItems(items.map(item => {
            if (item.id !== itemId) return item;
            const newTrials = [...(item.trials || Array(TRIALS_PER_CARD).fill(null))];
            if (newTrials[index] === null) newTrials[index] = 'pass';
            else if (newTrials[index] === 'pass') newTrials[index] = 'fail';
            else newTrials[index] = null;
            return { ...item, trials: newTrials };
        }));
    };

    const getCardStats = (item) => {
        const trials = item.trials || Array(TRIALS_PER_CARD).fill(null);
        const passCount = trials.filter(tr => tr === 'pass').length;
        return { passCount, isMastered: passCount >= MASTERY_THRESHOLD };
    };

    const handleSave = async () => {
        if (!childId) {
            setError('Please select a child from the dashboard first.');
            return;
        }
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
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({
                    childId,
                    type: 'PECS',
                    title,
                    content: {
                        phase: selectedPhase,
                        phaseName: currentPhase.name,
                        items: items.map(it => ({
                            id: it.id,
                            label: it.label,
                            imageUrl: it.imageUrl,
                            trials: it.trials || Array(TRIALS_PER_CARD).fill(null),
                            ...getCardStats(it),
                        })),
                        criteria: currentPhase.criteria,
                    }
                })
            });
            if (response.ok) {
                setError('');
                setSuccessMessage('Board saved successfully! Redirecting to dashboard…');
                setTimeout(() => navigate('/specialist/dashboard'), 1500);
            } else {
                const data = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    localStorage.removeItem('specialistToken');
                    localStorage.removeItem('specialistUser');
                    setError('Session expired. Please log in again.');
                    setTimeout(() => navigate('/specialist/login'), 2000);
                    return;
                }
                throw new Error(data.message || data.error || 'Failed to save');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pecs-creator-page">
            <div
                className="creator-page-bg"
                style={{ backgroundImage: `url(${pecsHeaderImg})` }}
                aria-hidden="true"
            />

            <div className="creator-content">
                <header className="creator-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                    <h1>PECS Board Creator</h1>
                    <button className="save-btn" onClick={handleSave} disabled={loading}>
                        {loading ? '⏳ Saving...' : '💾 Step 5: Save Board'}
                    </button>
                </header>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                {/* Step-by-step guide */}
                <div className="pecs-stepper">
                    <div className="pecs-step"><span className="pecs-step-num">1</span> Set board title</div>
                    <div className="pecs-step"><span className="pecs-step-num">2</span> Select PECS phase</div>
                    <div className="pecs-step"><span className="pecs-step-num">3</span> Add picture cards (upload or URL)</div>
                    <div className="pecs-step"><span className="pecs-step-num">4</span> Track trials per card (Pass / Fail)</div>
                    <div className="pecs-step"><span className="pecs-step-num">5</span> Save board</div>
                </div>

                <div className="creator-main">
                    {/* Left: Settings */}
                    <div className="settings-panel">
                        <div className="form-group">
                            <label><strong>Step 1:</strong> Board Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Morning Routine Board"
                            />
                        </div>

                        <div className="form-group">
                            <label><strong>Step 2:</strong> PECS Phase</label>
                            <select value={selectedPhase} onChange={(e) => setSelectedPhase(Number(e.target.value))}>
                                {PECS_PHASES.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

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

                        <div className="add-item-box">
                            <h3><strong>Step 3:</strong> Add Picture Card</h3>
                            <p className="step-hint">Upload an image or paste a URL. Each card gets its own trial tracking.</p>
                            <div className="form-group">
                                <label>Label</label>
                                <input type="text" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} placeholder="e.g., Apple" />
                            </div>
                            <div className="form-group">
                                <label>Image (upload or URL)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <label className="add-btn" style={{ margin: 0, cursor: 'pointer', display: 'inline-block', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                        {uploadingImage ? '⏳ Uploading...' : '📤 Upload'}
                                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={uploadingImage} style={{ display: 'none' }} />
                                    </label>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>or</span>
                                    <input type="text" value={newItemImage} onChange={(e) => setNewItemImage(e.target.value)} placeholder="Paste image URL" style={{ flex: 1, minWidth: 120 }} />
                                </div>
                            </div>
                            <button className="add-btn" onClick={addItem}>+ Add to Board</button>
                        </div>
                    </div>

                    {/* Right: Board + Trials per card */}
                    <div className="board-preview">
                        <h3>Step 4: Communication Board ({items.length} cards)</h3>
                        <p className="step-hint">Click trial cells under each card to log Pass / Fail. Green = pass, red = fail.</p>
                        <div className="pecs-grid">
                            {items.map(item => {
                                const { passCount, isMastered } = getCardStats(item);
                                const trials = item.trials || Array(TRIALS_PER_CARD).fill(null);
                                return (
                                    <div key={item.id} className="pecs-card-with-trials">
                                        <div className="pecs-card">
                                            <img src={getUploadUrl(item.imageUrl) || item.imageUrl} alt={item.label} onError={(e) => { e.target.src = `https://via.placeholder.com/120?text=${encodeURIComponent(item.label)}`; }} />
                                            <span>{item.label}</span>
                                            <button className="remove-card" onClick={() => removeItem(item.id)}>×</button>
                                        </div>
                                        <div className="pecs-card-trials">
                                            <div className="pecs-card-trial-row">
                                                {trials.map((trial, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        className={`trial-cell ${trial || 'empty'}`}
                                                        onClick={() => toggleTrial(item.id, i)}
                                                        title={`Trial ${i + 1}: ${trial === 'pass' ? 'Pass' : trial === 'fail' ? 'Fail' : 'Not tested'}`}
                                                    >
                                                        {trial === 'pass' ? '✅' : trial === 'fail' ? '❌' : (i + 1)}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="pecs-card-trial-summary">
                                                <span>{passCount}/{TRIALS_PER_CARD}</span>
                                                {isMastered && <span className="mastery-dot">🏆</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {items.length === 0 && <p className="empty-preview">Add picture cards in Step 3 to build the board.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PECSBoardCreator;
