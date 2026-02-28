import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ActivitiesCreator() {
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const navigate = useNavigate();
  const { authMutate } = useAuth('specialist');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentInstructions, setParentInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [materials, setMaterials] = useState([]);
  const [newMaterial, setNewMaterial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { if (!childId) setError('Please select a child first.'); }, [childId]);

  const addMaterial = () => {
    if (!newMaterial) return;
    setMaterials([...materials, newMaterial]);
    setNewMaterial('');
  };

  const removeMaterial = (i) => setMaterials(materials.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!childId || !title) { setError('Title is required.'); return; }
    setLoading(true);
    try {
      await authMutate('/specialized-plans', {
        body: {
          childId, type: 'Activity', title,
          content: { description, parentInstructions, dueDate, priority, materials },
        },
      });
      setSuccess('Activity saved!');
      setTimeout(() => navigate('/specialist/dashboard/children'), 1200);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary';
  const priorityColors = { low: 'bg-blue-100 text-blue-700 border-blue-200', medium: 'bg-amber-100 text-amber-700 border-amber-200', high: 'bg-error/10 text-error border-error/20' };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">Create Activity</h1>
              <p className="text-xs text-slate-500">Assign a home or therapy activity</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors">
            {loading ? 'Saving...' : 'Save Activity'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium mb-4">{error}</div>}
        {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium mb-4">{success}</div>}

        <div className="space-y-4">
          {/* Title */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <label className="block text-sm font-bold mb-2">Activity Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Color Matching Game" className={inputCls} />
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the activity and its therapeutic purpose..." className={inputCls} />
          </div>

          {/* Parent Instructions */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">family_restroom</span>
              Parent Instructions
            </label>
            <textarea value={parentInstructions} onChange={e => setParentInstructions(e.target.value)} rows={4} placeholder="Step-by-step instructions for parents to follow at home..." className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <label className="block text-sm font-bold mb-2">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
            </div>

            {/* Priority */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <label className="block text-sm font-bold mb-2">Priority</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map(p => (
                  <button key={p} onClick={() => setPriority(p)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 capitalize transition-colors ${priority === p ? priorityColors[p] : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">inventory_2</span>
              Materials Needed
            </label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={newMaterial} onChange={e => setNewMaterial(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMaterial()} placeholder="e.g., Colored blocks" className={`${inputCls} flex-1`} />
              <button onClick={addMaterial} disabled={!newMaterial} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">Add</button>
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {materials.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/5 text-primary rounded-full text-xs font-medium">
                    {m}
                    <button onClick={() => removeMaterial(i)} className="ml-1 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {title && (
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">preview</span>
                Preview
              </h3>
              <div className="p-4 bg-primary/5 rounded-xl space-y-2">
                <h4 className="font-bold">{title}</h4>
                {description && <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className={`px-2 py-0.5 rounded-full font-bold capitalize ${priorityColors[priority]}`}>{priority}</span>
                  {dueDate && <span>Due: {new Date(dueDate).toLocaleDateString()}</span>}
                  {materials.length > 0 && <span>{materials.length} materials</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
