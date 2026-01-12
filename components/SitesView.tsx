
import React, { useState } from 'react';
import { Site } from '../types';

interface SitesViewProps {
  sites: Site[];
  onAddSite: (site: Site) => void;
  onRemoveSite: (id: string) => void;
}

const SitesView: React.FC<SitesViewProps> = ({ sites, onAddSite, onRemoveSite }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Site>>({
    name: '',
    level: 'Secondary',
    mentorName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSite({
      ...formData as Site,
      id: crypto.randomUUID()
    });
    setIsAdding(false);
    setFormData({ name: '', level: 'Secondary', mentorName: '' });
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">My Sites</h2>
          <p className="text-slate-500 text-sm">Manage where you are logging hours.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-100 flex items-center justify-center text-xl transition-transform active:scale-90"
        >
          {isAdding ? '✕' : '+'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4 animate-in slide-in-from-top-4">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">School Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Oakridge Middle School"
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Level</label>
                <select 
                  value={formData.level}
                  onChange={e => setFormData({...formData, level: e.target.value as any})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="Primary">Primary (K-6)</option>
                  <option value="Secondary">Secondary (6-12)</option>
                  <option value="Alternate">Alternate</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Mentor Name</label>
                <input 
                  required
                  value={formData.mentorName}
                  onChange={e => setFormData({...formData, mentorName: e.target.value})}
                  placeholder="e.g. Dr. Smith"
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">
            Add Site
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map(site => (
          <div key={site.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-start justify-between group hover:border-blue-100 transition-all">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shadow-inner">
                {site.level === 'Secondary' ? '🎓' : (site.level === 'Primary' ? '🎒' : '🏢')}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{site.name}</h4>
                <p className="text-xs text-slate-400 font-medium uppercase mt-0.5 tracking-tight">{site.level}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Mentor:</span>
                  <span className="text-xs font-bold text-slate-600">{site.mentorName}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onRemoveSite(site.id)}
              className="text-slate-200 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 p-2"
              title="Remove Site"
            >
              🗑️
            </button>
          </div>
        ))}

        {sites.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">
            <div className="text-4xl mb-4">🏫</div>
            <h3 className="text-lg font-bold text-slate-600">No sites added</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Add your primary, secondary, and alternate sites here to organize your internship.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SitesView;
