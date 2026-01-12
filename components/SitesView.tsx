import React, { useState } from 'react';
import { Site } from '../types';
import { School, Building, GraduationCap, Trash2, Plus, X, User } from 'lucide-react';

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

  const getSiteIcon = (level: string) => {
    switch(level) {
      case 'Secondary': return <GraduationCap size={28} />;
      case 'Primary': return <School size={28} />;
      default: return <Building size={28} />;
    }
  };

  return (
    <div className="space-y-10 pb-24 md:pb-8">
      <header className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-3xl font-black text-app-dark tracking-tight">Placement Sites</h2>
          <p className="text-app-slate text-base font-bold opacity-70">Cataloging institutional mentorship locations.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`w-16 h-16 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center active:scale-90 ${
            isAdding 
              ? 'glass text-app-dark border border-white/60' 
              : 'bg-app-dark text-white shadow-app-dark/30 hover:rotate-90'
          }`}
        >
          {isAdding ? <X size={24} strokeWidth={3} /> : <Plus size={28} strokeWidth={3} />}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleSubmit} className="glass p-12 rounded-[3.5rem] border border-white/60 shadow-2xl space-y-10 animate-in zoom-in-95 duration-500">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[12px] font-black text-app-slate uppercase tracking-[0.2em] ml-3">Institution Identity</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="High School Name / District Office / Technical Academy"
                className="w-full bg-white/60 border-none rounded-[1.5rem] px-8 py-5 text-lg font-black text-app-dark focus:ring-4 focus:ring-app-bright/10 outline-none shadow-inner"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="block text-[12px] font-black text-app-slate uppercase tracking-[0.2em] ml-3">Academic Tier</label>
                <div className="relative">
                  <select 
                    value={formData.level}
                    onChange={e => setFormData({...formData, level: e.target.value as Site['level']})}
                    className="w-full bg-white/60 border-none rounded-[1.5rem] px-8 py-5 text-lg font-black text-app-dark focus:ring-4 focus:ring-app-bright/10 outline-none appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="Primary">Primary (K-6)</option>
                    <option value="Secondary">Secondary (6-12)</option>
                    <option value="Alternate">Alternate Placement</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <Plus size={16} className="rotate-45" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-[12px] font-black text-app-slate uppercase tracking-[0.2em] ml-3">Supervising Mentor</label>
                <input 
                  required
                  value={formData.mentorName}
                  onChange={e => setFormData({...formData, mentorName: e.target.value})}
                  placeholder="Principal / Admin Supervisor"
                  className="w-full bg-white/60 border-none rounded-[1.5rem] px-8 py-5 text-lg font-black text-app-dark focus:ring-4 focus:ring-app-bright/10 outline-none shadow-inner"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-app-dark text-white py-6 rounded-[2rem] font-black uppercase text-sm tracking-[0.4em] shadow-2xl shadow-app-dark/40 hover:bg-black active:scale-[0.98] transition-all">
            Establish Placement Record
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-1">
        {sites.map(site => (
          <div key={site.id} className="glass p-10 rounded-[3.5rem] shadow-sm border border-white/50 flex flex-col justify-between group hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-500 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-app-bright/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="relative z-10">
              <div className="flex gap-6 items-start">
                <div className="w-20 h-20 rounded-[2rem] glass-blue flex items-center justify-center text-app-slate group-hover:bg-app-dark group-hover:text-white transition-all duration-700 shadow-lg shrink-0">
                  {getSiteIcon(site.level)}
                </div>
                <div className="flex-1 overflow-hidden pt-2">
                  <h4 className="font-black text-app-dark text-2xl tracking-tight leading-tight group-hover:text-app-bright transition-colors">{site.name}</h4>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] text-app-bright font-black uppercase tracking-[0.2em] bg-app-bright/5 border border-app-bright/10 px-3 py-1.5 rounded-xl">{site.level} Setting</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-6 glass-blue rounded-[2rem] border border-white/50 shadow-inner group-hover:bg-white/60 transition-all">
                <div className="flex items-center gap-4 text-app-deep">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-app-light/20 shadow-sm text-app-bright group-hover:scale-110 transition-transform">
                     <User size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[9px] text-app-slate font-black uppercase tracking-[0.2em] block leading-none mb-1 opacity-60">Mentor Supervisor</span>
                    <span className="text-sm font-black text-app-dark">{site.mentorName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <button 
                onClick={() => onRemoveSite(site.id)}
                className="w-12 h-12 flex items-center justify-center text-app-light hover:text-red-500 bg-app-dark/5 hover:bg-red-50 rounded-2xl transition-all shadow-sm active:scale-90"
                title="Decommission Placement Record"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}

        {sites.length === 0 && !isAdding && (
          <div className="col-span-full py-40 text-center glass-blue rounded-[5rem] border-4 border-dashed border-app-light/30">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-app-light shadow-2xl">
               <School size={64} strokeWidth={1.2} />
            </div>
            <h3 className="text-3xl font-black text-app-slate tracking-tight">No Active Sites.</h3>
            <p className="text-app-slate/60 text-lg font-bold mt-3">Initialize your placements to structure your hours.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SitesView;