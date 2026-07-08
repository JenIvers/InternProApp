import React, { useState } from 'react';
import { Artifact, Shelf } from '../types';
import { ALL_COMPETENCIES } from '../constants';
import { Folder, FolderPlus, Plus, FileText, X, Tag, Archive, Check, Loader, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { uploadFileToStorage } from '../storageService';
import { User } from 'firebase/auth';

interface ArtifactsViewProps {
  artifacts: Artifact[];
  shelves: Shelf[];
  onAddArtifact: (artifact: Artifact) => void;
  onUpdateArtifact: (artifact: Artifact) => void;
  onAddShelf: (name: string) => void;
  isReadOnly?: boolean;
  user?: User | null;
}

const ArtifactRow: React.FC<{
  artifact: Artifact,
  onSelect: (artifact: Artifact) => void
}> = ({ artifact, onSelect }) => {
  const isImage = artifact.type.startsWith('image');
  const tagCount = artifact.taggedCompetencyIds?.length ?? 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(artifact)}
      className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[52px] text-left hover:bg-app-slate/5 transition-colors"
    >
      <span className="shrink-0 w-9 h-9 rounded-lg bg-app-bg border border-app-slate/10 flex items-center justify-center overflow-hidden text-app-slate">
        {isImage ? (
          <img src={artifact.data} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText size={18} strokeWidth={2} />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-app-dark truncate">{artifact.name}</span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-app-slate opacity-70">
          <span className="truncate">{artifact.uploadDate}</span>
          {tagCount > 0 && (
            <>
              <span className="opacity-50">·</span>
              <span className="inline-flex items-center gap-0.5 shrink-0">
                <Tag size={10} /> {tagCount}
              </span>
            </>
          )}
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-app-slate opacity-60" />
    </button>
  );
};

const ShelfSection: React.FC<{
  shelf?: Shelf,
  artifactsInShelf: Artifact[],
  onSelectArtifact: (artifact: Artifact) => void
}> = ({ shelf, artifactsInShelf, onSelectArtifact }) => (
  <div className="rounded-xl border border-app-slate/15 bg-white overflow-hidden">
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-app-slate/10">
      <div className="flex items-center gap-2 min-w-0">
        {shelf ? (
          <Folder size={14} className="text-app-slate shrink-0" strokeWidth={2.5} />
        ) : (
          <Archive size={14} className="text-app-slate shrink-0" strokeWidth={2.5} />
        )}
        <h3 className="text-xs font-bold text-app-slate truncate">
          {shelf ? shelf.name : 'Unshelved'}
        </h3>
      </div>
      <span className="text-xs font-bold text-app-slate tabular-nums shrink-0">
        {artifactsInShelf.length}
      </span>
    </div>
    {artifactsInShelf.length === 0 ? (
      <div className="px-4 py-3 text-xs font-medium text-app-slate opacity-60">
        No artifacts on this shelf yet.
      </div>
    ) : (
      <ul className="divide-y divide-app-slate/10">
        {artifactsInShelf.map(art => (
          <li key={art.id}>
            <ArtifactRow artifact={art} onSelect={onSelectArtifact} />
          </li>
        ))}
      </ul>
    )}
  </div>
);

const ArtifactsView: React.FC<ArtifactsViewProps> = ({
  artifacts,
  shelves,
  onAddArtifact,
  onUpdateArtifact,
  onAddShelf,
  isReadOnly,
  user
}) => {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [isCreatingShelf, setIsCreatingShelf] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      if (!user) setUploadError("You must be logged in to upload files");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const artifactId = crypto.randomUUID();

      // Upload to Firebase Storage
      const uploadResult = await uploadFileToStorage(user.uid, file, artifactId);

      if (!uploadResult.success) {
        setUploadError(uploadResult.error || "Upload failed");
        setTimeout(() => setUploadError(null), 5000);
        return;
      }

      // Create artifact with Storage URL instead of Base64
      const newArtifact: Artifact = {
        id: artifactId,
        name: file.name,
        type: file.type,
        data: uploadResult.url!, // Storage URL instead of Base64
        uploadDate: new Date().toLocaleDateString(),
        taggedCompetencyIds: [],
        shelfId: undefined
      };

      onAddArtifact(newArtifact);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("An unexpected error occurred during upload");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
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
    <div className="space-y-6 pb-24 md:pb-8">
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-app-dark tracking-tight">Portfolio Vault</h1>
            <p className="text-app-slate text-sm font-medium opacity-70">
              Curate evidence of your administrative journey.
            </p>
          </div>
          {!isReadOnly && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreatingShelf(true)}
                className="flex items-center gap-1.5 py-2 px-3 rounded-lg border border-app-slate/15 text-app-slate text-sm font-semibold hover:bg-app-slate/5 transition-colors"
                title="Create a new shelf"
              >
                <FolderPlus size={16} /> <span className="hidden sm:inline">New shelf</span>
              </button>
              <label
                className={`flex items-center gap-1.5 py-2 px-3 rounded-lg bg-app-dark text-white text-sm font-semibold transition-colors ${
                  isUploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-app-deep'
                }`}
              >
                {isUploading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                <span>{isUploading ? 'Uploading…' : 'Upload'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,application/pdf"
                  disabled={isUploading}
                />
              </label>
            </div>
          )}
        </div>

        {/* Upload Error Notification */}
        {uploadError && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
              <X size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-red-600 text-sm font-bold">Upload failed</p>
              <p className="text-red-500/80 text-xs font-medium truncate">{uploadError}</p>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {isCreatingShelf && (
          <form
            onSubmit={handleCreateShelf}
            className="rounded-xl border border-app-slate/15 bg-white p-4 flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-app-slate mb-1.5">
                Shelf name
              </label>
              <input
                autoFocus
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder="e.g., PLCs, Observation Cycles…"
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-lg bg-app-bg border border-app-slate/15 outline-none focus:ring-2 focus:ring-app-bright/30 font-medium text-app-dark placeholder:text-app-light/70"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none py-2.5 px-5 rounded-lg bg-app-dark text-white text-sm font-semibold hover:bg-app-deep transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingShelf(false)}
                className="py-2.5 px-3 rounded-lg text-app-slate hover:bg-app-slate/5 transition-colors"
                aria-label="Cancel"
              >
                <X size={18} />
              </button>
            </div>
          </form>
        )}
      </header>

      <div className="space-y-4">
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
          <div className="absolute inset-0 bg-app-dark/40" onClick={() => setSelectedArtifact(null)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-t-2xl sm:rounded-2xl border border-app-slate/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <header className="p-4 sm:p-5 border-b border-app-slate/10 flex items-center justify-between gap-3 sticky top-0 bg-white z-10 pt-safe">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-app-dark truncate">{selectedArtifact.name}</h3>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] font-medium text-app-slate">
                  <span>{selectedArtifact.type}</span>
                  <span className="opacity-40">·</span>
                  <span>{selectedArtifact.uploadDate}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArtifact(null)}
                className="shrink-0 p-2 rounded-lg text-app-slate hover:bg-app-slate/10 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>

            <div className="overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
              <div className="aspect-[16/10] bg-app-bg rounded-xl border border-app-slate/15 overflow-hidden flex items-center justify-center">
                {selectedArtifact.type.startsWith('image') ? (
                  <img src={selectedArtifact.data} alt={selectedArtifact.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-app-slate opacity-50">
                    <ImageIcon size={56} strokeWidth={1.25} />
                    <p className="text-xs font-bold">Preview unavailable</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Shelf assignment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Folder size={14} className="text-app-slate" strokeWidth={2.5} />
                    <label className="text-xs font-bold text-app-slate">Shelf</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => !isReadOnly && moveArtifactToShelf(selectedArtifact, undefined)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        !selectedArtifact.shelfId
                          ? 'bg-app-dark text-white border-app-dark'
                          : 'bg-white text-app-slate border-app-slate/15 hover:bg-app-slate/5'
                      } ${isReadOnly ? 'cursor-default' : ''}`}
                    >
                      Unshelved
                    </button>
                    {shelves.map(shelf => (
                      <button
                        key={shelf.id}
                        onClick={() => !isReadOnly && moveArtifactToShelf(selectedArtifact, shelf.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedArtifact.shelfId === shelf.id
                            ? 'bg-app-bright text-white border-app-bright'
                            : 'bg-white text-app-slate border-app-slate/15 hover:bg-app-slate/5'
                        } ${isReadOnly ? 'cursor-default' : ''}`}
                      >
                        {shelf.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Competency tagging */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-app-slate" strokeWidth={2.5} />
                    <label className="text-xs font-bold text-app-slate">Competency alignment</label>
                  </div>
                  <div className="rounded-xl border border-app-slate/15 bg-white overflow-hidden max-h-64 overflow-y-auto no-scrollbar">
                    <ul className="divide-y divide-app-slate/10">
                      {ALL_COMPETENCIES.map(comp => {
                        const isTagged = selectedArtifact.taggedCompetencyIds?.includes(comp.id);
                        return (
                          <li key={comp.id}>
                            <button
                              onClick={() => !isReadOnly && toggleCompetencyTag(selectedArtifact, comp.id)}
                              className={`w-full text-left flex items-start gap-3 px-4 py-2.5 min-h-[44px] transition-colors ${
                                isTagged ? 'bg-app-bright/5' : 'hover:bg-app-slate/5'
                              } ${isReadOnly ? 'cursor-default' : ''}`}
                            >
                              <span className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-colors ${
                                isTagged ? 'border-app-dark bg-app-dark text-white' : 'border-app-slate/30'
                              }`}>
                                {isTagged && <Check size={13} strokeWidth={3} />}
                              </span>
                              <span className="min-w-0">
                                <span className={`block text-sm font-semibold leading-tight truncate ${isTagged ? 'text-app-dark' : 'text-app-slate'}`}>
                                  {comp.id}: {comp.title}
                                </span>
                                <span className="block text-[11px] text-app-slate font-medium line-clamp-1 opacity-60">{comp.description}</span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <footer className="p-4 sm:p-5 bg-white border-t border-app-slate/10 pb-safe">
              <button
                onClick={() => setSelectedArtifact(null)}
                className="w-full py-3 rounded-lg bg-app-dark text-white text-sm font-semibold hover:bg-app-deep transition-colors active:scale-[0.99]"
              >
                {isReadOnly ? 'Close' : 'Done'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactsView;
