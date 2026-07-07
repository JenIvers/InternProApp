import React, { useState } from 'react';
import { Site } from '../types';
import { MapPin, Plus, X, ChevronDown } from 'lucide-react';

export interface SitePickerProps {
  sites: Site[];
  /** Selected site id, if the location resolves to a saved Site. */
  siteId?: string;
  /** Free-text location fallback (used when no site is selected, or to override the site's name). */
  location?: string;
  onChange: (value: { siteId?: string; location?: string }) => void;
  onAddSite: (site: Site) => void;
  isReadOnly?: boolean;
}

const SitePicker: React.FC<SitePickerProps> = ({ sites, siteId, location, onChange, onAddSite, isReadOnly }) => {
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [newSite, setNewSite] = useState<Partial<Site>>({ name: '', level: 'Secondary', mentorName: '' });

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__custom__') {
      onChange({ siteId: undefined, location: location || '' });
    } else if (value === '') {
      onChange({ siteId: undefined, location: undefined });
    } else {
      const site = sites.find(s => s.id === value);
      onChange({ siteId: value, location: site?.name });
    }
  };

  const handleAddSiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.name || !newSite.level) return;
    const site: Site = {
      id: crypto.randomUUID(),
      name: newSite.name,
      level: newSite.level as Site['level'],
      mentorName: newSite.mentorName || '',
    };
    onAddSite(site);
    onChange({ siteId: site.id, location: site.name });
    setNewSite({ name: '', level: 'Secondary', mentorName: '' });
    setIsAddingSite(false);
  };

  const isCustom = !siteId && !!location;

  if (isReadOnly) {
    const site = sites.find(s => s.id === siteId);
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-app-dark">
        <MapPin size={14} className="text-app-slate/50" />
        {site?.name || location || 'No location set'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          value={isCustom ? '__custom__' : (siteId || '')}
          onChange={handleSelectChange}
          className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-white border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 text-sm font-bold text-app-dark appearance-none cursor-pointer"
        >
          <option value="">Select a site&hellip;</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>{site.name} ({site.level})</option>
          ))}
          <option value="__custom__">Other / type location&hellip;</option>
        </select>
        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-slate/50 pointer-events-none" />
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-app-slate/50 pointer-events-none" />
      </div>

      {isCustom && (
        <input
          type="text"
          value={location || ''}
          onChange={e => onChange({ siteId: undefined, location: e.target.value })}
          placeholder="Type a location name"
          className="w-full px-4 py-3 rounded-xl bg-white border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 text-sm font-semibold text-app-dark"
        />
      )}

      {!isAddingSite ? (
        <button
          type="button"
          onClick={() => setIsAddingSite(true)}
          className="flex items-center gap-1.5 text-[11px] font-black text-app-bright uppercase tracking-widest"
        >
          <Plus size={14} /> Add New Site
        </button>
      ) : (
        <form onSubmit={handleAddSiteSubmit} className="p-4 bg-app-bg/50 rounded-xl border border-app-dark/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-app-slate uppercase tracking-widest">New Site</span>
            <button type="button" onClick={() => setIsAddingSite(false)} className="text-app-slate/50 hover:text-app-dark">
              <X size={16} />
            </button>
          </div>
          <input
            required
            value={newSite.name || ''}
            onChange={e => setNewSite({ ...newSite, name: e.target.value })}
            placeholder="Site name"
            className="w-full px-4 py-2.5 rounded-lg bg-white border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 text-sm font-semibold text-app-dark"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newSite.level}
              onChange={e => setNewSite({ ...newSite, level: e.target.value as Site['level'] })}
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 text-sm font-semibold text-app-dark"
            >
              <option value="Primary">Primary (K-6)</option>
              <option value="Secondary">Secondary (6-12)</option>
              <option value="Alternate">Alternate</option>
            </select>
            <input
              value={newSite.mentorName || ''}
              onChange={e => setNewSite({ ...newSite, mentorName: e.target.value })}
              placeholder="Mentor name"
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 text-sm font-semibold text-app-dark"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-app-dark text-white rounded-lg font-black uppercase text-xs tracking-widest hover:bg-black transition-colors"
          >
            Save Site
          </button>
        </form>
      )}
    </div>
  );
};

export default SitePicker;
