
import React, { useState } from 'react';
import { InternshipLog } from '../types';
import { ALL_COMPETENCIES } from '../constants';
import { suggestCompetencies } from '../geminiService';

interface LogsViewProps {
  logs: InternshipLog[];
  onAddLog: (log: InternshipLog) => void;
}

const LogsView: React.FC<LogsViewProps> = ({ logs, onAddLog }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [formData, setFormData] = useState<Partial<InternshipLog>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '12:00',
    hours: 4,
    activity: '',
    location: '',
    schoolLevel: 'Secondary',
    taggedCompetencyIds: [],
    reflections: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCompetency = (id: string) => {
    setFormData(prev => {
      const current = prev.taggedCompetencyIds || [];
      const next = current.includes(id) 
        ? current.filter(cid => cid !== id) 
        : [...current, id];
      return { ...prev, taggedCompetencyIds: next };
    });
  };

  const handleAutoSuggest = async () => {
    if (!formData.activity) return;
    setIsSuggesting(true);
    const suggested = await suggestCompetencies(formData.activity);
    setFormData(prev => ({ ...prev, taggedCompetencyIds: suggested }));
    setIsSuggesting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: InternshipLog = {
      id: crypto.randomUUID(),
      date: formData.date!,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      hours: Number(formData.hours),
      activity: formData.activity!,
      location: formData.location!,
      schoolLevel: formData.schoolLevel as any,
      taggedCompetencyIds: formData.taggedCompetencyIds || [],
      reflections: formData.reflections || '',
      artifactIds: []
    };
    onAddLog(newLog);
    setIsAdding(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: '',
      location: '',
      schoolLevel: 'Secondary',
      taggedCompetencyIds: [],
      reflections: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Hours & Activity Log</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow-sm hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <span>{isAdding ? 'Cancel' : '+ Log Hours'}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hours</label>
              <input type="number" step="0.5" name="hours" value={formData.hours} onChange={handleInputChange} required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School Level</label>
              <select name="schoolLevel" value={formData.schoolLevel} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Elementary">Elementary</option>
                <option value="Secondary">Secondary</option>
                <option value="Alternate">Alternate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Activity Description</label>
            <div className="relative">
              <textarea
                name="activity"
                value={formData.activity}
                onChange={handleInputChange}
                required
                placeholder="What did you do during these hours?"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-24"
              />
              <button
                type="button"
                onClick={handleAutoSuggest}
                disabled={isSuggesting || !formData.activity}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {isSuggesting ? 'Analyzing...' : '✨ Suggest Competencies'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tag Competencies</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-xl">
              {ALL_COMPETENCIES.map(comp => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => toggleCompetency(comp.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    formData.taggedCompetencyIds?.includes(comp.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {comp.id}: {comp.title}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
            Save Log Entry
          </button>
        </form>
      )}

      <div className="space-y-4">
        {logs.slice().reverse().map(log => (
          <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">{log.date}</span>
                <h4 className="text-lg font-bold text-slate-800 mt-2">{log.activity}</h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-800">{log.hours}</span>
                <span className="text-xs text-slate-400 block uppercase font-bold">Hours</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {log.taggedCompetencyIds.map(id => {
                const comp = ALL_COMPETENCIES.find(c => c.id === id);
                return (
                  <span key={id} title={comp?.description} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                    {id}
                  </span>
                );
              })}
            </div>
            
            <div className="flex items-center text-xs text-slate-400 space-x-4">
              <span className="flex items-center"><span className="mr-1">🏫</span> {log.schoolLevel}</span>
              {log.location && <span className="flex items-center"><span className="mr-1">📍</span> {log.location}</span>}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="text-4xl mb-4">✍️</div>
            <h3 className="text-lg font-bold text-slate-600">No logs found</h3>
            <p className="text-slate-400">Start by adding your first internship activity.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsView;
