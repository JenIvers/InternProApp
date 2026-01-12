import React, { useState } from 'react';
import { Artifact, Shelf } from '../types';
import { ALL_COMPETENCIES } from '../constants';
import { Folder, FolderPlus, Plus, FileText, X, Tag, Calendar, MoreVertical, Archive, Library, Check } from 'lucide-react';

interface ArtifactsViewProps {
  artifacts: Artifact[];
  shelves: Shelf[];
  onAddArtifact: (artifact: Artifact) => void;
  onUpdateArtifact: (artifact: Artifact) => void;
  onAddShelf: (name: string) => void;
}

const ArtifactCard: React.FC<{ 
  artifact: Artifact, 
  onSelect: (artifact: Artifact) => void 
}> = ({ artifact, onSelect }) => (
  <div 
    onClick={() => onSelect(artifact)}
    className="glass rounded-[2.5rem] border border-white/50 overflow-hidden shadow-sm hover:shadow-2xl hover:scale-[1.03] transition-all active:scale-95 cursor-pointer group animate-in zoom-in-95 duration-300"
  >
    <div className="aspect-square bg-app-bg flex items-center justify-center relative overflow-hidden group-hover:bg-app-light/20 transition-colors">
      {artifact.type.startsWith('image') ? (
        <img src={artifact.data} alt={artifact.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
      ) : (
        <div className="flex flex-col items-center text-app-light group-hover:text-app-bright transition-colors">
          <div className="p-6 rounded-3xl bg-white shadow-inner">
            <FileText size={48} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 opacity-60">{artifact.type.split('/')[1] || 'FILE'}</span>
        </div>
      )}
      <div className="absolute top-4 right-4 flex gap-1">
        {artifact.taggedCompetencyIds && artifact.taggedCompetencyIds.length > 0 && (
          <div className="bg-app-dark/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-2xl uppercase tracking-tighter">
            {artifact.taggedCompetencyIds.length} Tags
          </div>
        )}
      </div>
    </div>
    <div className="p-5 flex items-center justify-between gap-3">
      <div className="overflow-hidden">
        <p className="text-sm font-black text-app-dark truncate">{artifact.name}</p>
        <div className="flex items-center gap-2 mt-1 opacity-60">
           <Calendar size={12} className="text-app-slate" />
           <p className="text-[9px] text-app-slate font-black uppercase tracking-widest">{artifact.uploadDate}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-app-light group-hover:text-app-bright transition-colors">
         <MoreVertical size={18} />
      </div>
    </div>
  </div>
);

const ShelfSection: React.FC<{ 
  shelf?: Shelf, 
  artifactsInShelf: Artifact[],
  onSelectArtifact: (artifact: Artifact) => void
}> = ({ shelf, artifactsInShelf, onSelectArtifact }) => (
  <div className="mb-14 px-2">
    <div className="flex items-center justify-between mb-8 border-b border-app-light/30 pb-5">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${shelf ? 'bg-app-bright text-white rotate-3 shadow-app-bright/20' : 'glass-blue text-app-slate'}`}>
          {shelf ? <Folder size={24} strokeWidth={2.5} /> : <Archive size={24} strokeWidth={2.5} />}
        </div>
        <div>
          <h3 className="text-lg font-black text-app-dark tracking-tight uppercase tracking-wider">
            {shelf ? shelf.name : 'Unshelved Artifacts'}
          </h3>
          <p className="text-[10px] font-black text-app-slate uppercase tracking-[0.2em] opacity-60">
             {artifactsInShelf.length} Professional Documents
          </p>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {artifactsInShelf.map(art => (
        <ArtifactCard key={art.id} artifact={art} onSelect={onSelectArtifact} />
      ))}
      {artifactsInShelf.length === 0 && (
        <div className="col-span-full py-12 px-8 glass-blue rounded-[2.5rem] border border-dashed border-app-bright/20 text-center">
           <p className="text-sm text-app-slate font-black italic opacity-50">No artifacts have been placed on this shelf.</p>
        </div>
      )}
    </div>
  </div>
);

const ArtifactsView: React.FC<ArtifactsViewProps> = ({ 
  artifacts, 
  shelves, 
  onAddArtifact, 
  onUpdateArtifact,
  onAddShelf 
}) => {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [isCreatingShelf, setIsCreatingShelf] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newArtifact: Artifact = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        data: reader.result as string,
        uploadDate: new Date().toLocaleDateString(),
        taggedCompetencyIds: [],
        shelfId: undefined
      };
      onAddArtifact(newArtifact);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (newShelfName.trim()) {
      onAddShelf(newShelfName.trim());
      setNewShelfName('');
      setIsCreatingShelf(false);
    }
  };

  const toggleCompetencyTag = (artifact: Artifact, competencyId: string) => {
    const currentTags = artifact.taggedCompetencyIds || [];
    const newTags = currentTags.includes(competencyId)
      ? currentTags.filter(id => id !== competencyId)
      : [...currentTags, competencyId];
    
    onUpdateArtifact({ ...artifact, taggedCompetencyIds: newTags });
  };

  const moveArtifactToShelf = (artifact: Artifact, shelfId: string | undefined) => {
    onUpdateArtifact({ ...artifact, shelfId });
  };

  return (
    <div className="space-y-12 pb-24 md:pb-8">
      <header className="flex flex-col space-y-8 px-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 rounded-xl glass-blue">
                 <Library className="text-app-dark" size={24} />
               </div>
               <h2 className="text-3xl font-black text-app-dark tracking-tight">Portfolio Vault</h2>
            </div>
            <p className="text-app-slate text-base font-bold opacity-70">Curate evidence of your administrative journey.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsCreatingShelf(true)}
              className="w-14 h-14 glass text-app-slate hover:text-app-bright rounded-[1.5rem] shadow-xl flex items-center justify-center transition-all active:scale-90 border border-white/50"
              title="Create New Portfolio Shelf"
            >
              <FolderPlus size={26} />
            </button>
            <label className="w-14 h-14 bg-app-dark text-white rounded-[1.5rem] shadow-2xl shadow-app-dark/30 flex items-center justify-center cursor-pointer hover:bg-app-deep transition-all active:scale-90">
              <Plus size={32} strokeWidth={3} />
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
            </label>
          </div>
        </div>

        {isCreatingShelf && (
          <form onSubmit={handleCreateShelf} className="glass p-10 rounded-[3rem] shadow-2xl border-2 border-app-bright/20 flex gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="flex-1">
              <label className="text-[11px] font-black text-app-slate uppercase tracking-widest mb-2 block ml-2">Shelf Designation</label>
              <input 
                autoFocus
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder="e.g., PLCs, Observation Cycles, Fiscal Audits..."
                className="w-full bg-white/60 border-none rounded-2xl px-6 py-4 text-base outline-none focus:ring-4 focus:ring-app-bright/10 font-black text-app-dark placeholder:text-app-light/50 shadow-inner"
              />
            </div>
            <div className="flex items-end gap-3 pb-0.5">
              <button type="submit" className="bg-app-bright text-white h-[56px] px-10 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-app-bright/20 hover:bg-app-deep active:scale-95 transition-all">Create</button>
              <button type="button" onClick={() => setIsCreatingShelf(false)} className="h-[56px] w-[56px] flex items-center justify-center text-app-slate bg-app-dark/5 hover:text-red-500 rounded-2xl transition-colors">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
          </form>
        )}
      </header>

      <div className="space-y-6">
        {shelves.map(shelf => (
          <ShelfSection 
            key={shelf.id} 
            shelf={shelf} 
            artifactsInShelf={artifacts.filter(a => a.shelfId === shelf.id)} 
            onSelectArtifact={setSelectedArtifact}
          />
        ))}
        <ShelfSection 
          artifactsInShelf={artifacts.filter(a => !a.shelfId)} 
          onSelectArtifact={setSelectedArtifact}
        />
      </div>

      {selectedArtifact && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-app-dark/70 backdrop-blur-2xl" onClick={() => setSelectedArtifact(null)}></div>
          <div className="relative glass w-full max-w-4xl sm:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-12 duration-500">
            <header className="p-10 border-b border-white/20 flex items-center justify-between sticky top-0 bg-white/70 z-10">
              <div className="flex-1 mr-6 overflow-hidden">
                 <h3 className="text-2xl font-black text-app-dark truncate">{selectedArtifact.name}</h3>
                 <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] font-black text-app-bright bg-app-bright/10 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedArtifact.type}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-app-light/50"></span>
                    <span className="text-[11px] font-black text-app-slate uppercase tracking-widest">{selectedArtifact.uploadDate}</span>
                 </div>
              </div>
              <button onClick={() => setSelectedArtifact(null)} className="p-4 bg-app-dark/5 text-app-dark hover:bg-app-dark hover:text-white rounded-[1.5rem] transition-all active:scale-90 shadow-sm">
                <X size={24} strokeWidth={3} />
              </button>
            </header>
            
            <div className="overflow-y-auto p-10 space-y-12 no-scrollbar">
              <div className="aspect-[16/10] glass-blue rounded-[2.5rem] overflow-hidden flex items-center justify-center border-4 border-white/60 shadow-inner group">
                {selectedArtifact.type.startsWith('image') ? (
                  <img src={selectedArtifact.data} className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500" />
                ) : (
                  <div className="flex flex-col items-center gap-6 text-app-slate opacity-40">
                    <div className="p-10 rounded-full bg-white shadow-xl">
                      <FileText size={100} strokeWidth={1} />
                    </div>
                    <p className="font-black text-sm uppercase tracking-[0.4em]">Document Preview Restricted</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl glass-blue flex items-center justify-center">
                       <Folder size={16} className="text-app-bright" />
                     </div>
                     <label className="text-[12px] font-black text-app-dark uppercase tracking-[0.2em]">Portfolio Designation</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => moveArtifactToShelf(selectedArtifact, undefined)}
                      className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${!selectedArtifact.shelfId ? 'bg-app-dark text-white shadow-xl shadow-app-dark/20' : 'glass text-app-slate border border-white/50 hover:bg-white'}`}
                    >
                      Unshelved
                    </button>
                    {shelves.map(shelf => (
                      <button
                        key={shelf.id}
                        onClick={() => moveArtifactToShelf(selectedArtifact, shelf.id)}
                        className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedArtifact.shelfId === shelf.id ? 'bg-app-bright text-white shadow-xl shadow-app-bright/20' : 'glass text-app-slate border border-white/50 hover:bg-white'}`}
                      >
                        {shelf.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl glass-blue flex items-center justify-center">
                       <Tag size={16} className="text-app-bright" />
                     </div>
                     <label className="text-[12px] font-black text-app-dark uppercase tracking-[0.2em]">Competency Alignment</label>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                    {ALL_COMPETENCIES.map(comp => {
                      const isTagged = selectedArtifact.taggedCompetencyIds?.includes(comp.id);
                      return (
                        <button
                          key={comp.id}
                          onClick={() => toggleCompetencyTag(selectedArtifact, comp.id)}
                          className={`text-left p-5 rounded-[2rem] border transition-all flex items-start gap-5 ${
                            isTagged ? 'bg-app-bright/10 border-app-bright shadow-sm' : 'bg-white/40 border-white/50 hover:bg-white'
                          }`}
                        >
                          <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            isTagged ? 'border-app-dark bg-app-dark text-white' : 'border-app-light'
                          }`}>
                            {isTagged && <Check size={14} strokeWidth={4} />}
                          </div>
                          <div className="overflow-hidden">
                            <p className={`text-sm font-black leading-tight mb-1 truncate ${isTagged ? 'text-app-dark' : 'text-app-slate'}`}>{comp.id}: {comp.title}</p>
                            <p className="text-[10px] text-app-slate font-medium line-clamp-1 opacity-60">{comp.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <footer className="p-10 bg-white/70 border-t border-white/20 backdrop-blur-md">
              <button 
                onClick={() => setSelectedArtifact(null)}
                className="w-full bg-app-dark text-white py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-[0.98]"
              >
                Sync Artifact Updates
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactsView;