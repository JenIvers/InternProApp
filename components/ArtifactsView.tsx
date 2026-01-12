
import React, { useState } from 'react';
import { Artifact, Shelf } from '../types';
import { ALL_COMPETENCIES } from '../constants';

interface ArtifactsViewProps {
  artifacts: Artifact[];
  shelves: Shelf[];
  onAddArtifact: (artifact: Artifact) => void;
  onUpdateArtifact: (artifact: Artifact) => void;
  onAddShelf: (name: string) => void;
}

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

  // Fix: Explicitly type sub-components as React.FC to allow 'key' prop in JSX
  const ArtifactCard: React.FC<{ artifact: Artifact }> = ({ artifact }) => (
    <div 
      onClick={() => setSelectedArtifact(artifact)}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer group"
    >
      <div className="aspect-square bg-slate-100 flex items-center justify-center relative overflow-hidden">
        {artifact.type.startsWith('image') ? (
          <img src={artifact.data} alt={artifact.name} className="object-cover w-full h-full" />
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-1">📄</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{artifact.type.split('/')[1] || 'FILE'}</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {artifact.taggedCompetencyIds?.length > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
              {artifact.taggedCompetencyIds.length} TAGS
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-slate-700 truncate">{artifact.name}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{artifact.uploadDate}</p>
      </div>
    </div>
  );

  // Fix: Explicitly type sub-components as React.FC to allow 'key' prop in JSX
  const ShelfSection: React.FC<{ shelf?: Shelf, artifactsInShelf: Artifact[] }> = ({ shelf, artifactsInShelf }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
          <span className="mr-2">{shelf ? '📚' : '📥'}</span>
          {shelf ? shelf.name : 'Uncategorized'}
          <span className="ml-2 bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full text-[10px]">
            {artifactsInShelf.length}
          </span>
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {artifactsInShelf.map(art => (
          <ArtifactCard key={art.id} artifact={art} />
        ))}
      </div>
      {artifactsInShelf.length === 0 && (
        <p className="text-xs text-slate-300 italic py-4">No artifacts in this shelf.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Artifact Vault</h2>
            <p className="text-slate-500">Evidence of your professional growth.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCreatingShelf(true)}
              className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
              title="Create Shelf"
            >
              <span className="text-2xl">📁+</span>
            </button>
            <label className="w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-100 flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-all active:scale-90">
              <span className="text-xl">+</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
            </label>
          </div>
        </div>

        {isCreatingShelf && (
          <form onSubmit={handleCreateShelf} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex gap-2 animate-in slide-in-from-top-2">
            <input 
              autoFocus
              value={newShelfName}
              onChange={(e) => setNewShelfName(e.target.value)}
              placeholder="Shelf Name (e.g., Staff Meetings)"
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Create</button>
            <button type="button" onClick={() => setIsCreatingShelf(false)} className="text-slate-400 text-sm font-bold px-2">Cancel</button>
          </form>
        )}
      </header>

      {/* Shelves rendering */}
      <div className="space-y-2">
        {shelves.map(shelf => (
          <ShelfSection 
            key={shelf.id} 
            shelf={shelf} 
            artifactsInShelf={artifacts.filter(a => a.shelfId === shelf.id)} 
          />
        ))}
        <ShelfSection 
          artifactsInShelf={artifacts.filter(a => !a.shelfId)} 
        />
      </div>

      {artifacts.length === 0 && !isCreatingShelf && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-bold text-slate-600">No artifacts yet</h3>
          <p className="text-slate-400 max-w-xs mx-auto text-sm">Upload photos of student work, meeting agendas, or observation notes.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedArtifact(null)}></div>
          <div className="relative bg-white w-full max-w-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-800 truncate pr-4">{selectedArtifact.name}</h3>
              <button onClick={() => setSelectedArtifact(null)} className="p-2 text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-6">
              <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100">
                {selectedArtifact.type.startsWith('image') ? (
                  <img src={selectedArtifact.data} className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-6xl">📄</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Organize into Shelf</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => moveArtifactToShelf(selectedArtifact, undefined)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!selectedArtifact.shelfId ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
                  >
                    None
                  </button>
                  {shelves.map(shelf => (
                    <button
                      key={shelf.id}
                      onClick={() => moveArtifactToShelf(selectedArtifact, shelf.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedArtifact.shelfId === shelf.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {shelf.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Link Competencies</label>
                <p className="text-[10px] text-slate-400 mb-3 italic">Which standards does this artifact demonstrate?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_COMPETENCIES.map(comp => {
                    const isTagged = selectedArtifact.taggedCompetencyIds?.includes(comp.id);
                    return (
                      <button
                        key={comp.id}
                        onClick={() => toggleCompetencyTag(selectedArtifact, comp.id)}
                        className={`text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                          isTagged ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          isTagged ? 'border-blue-600 bg-blue-600' : 'border-slate-200'
                        }`}>
                          {isTagged && <span className="text-[10px] text-white">✓</span>}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isTagged ? 'text-blue-700' : 'text-slate-700'}`}>{comp.id}: {comp.title}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{comp.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setSelectedArtifact(null)}
                className="w-full bg-slate-800 text-white py-3 rounded-2xl font-bold shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactsView;
