
import React from 'react';
import { Artifact } from '../types';

interface ArtifactsViewProps {
  artifacts: Artifact[];
  onAddArtifact: (artifact: Artifact) => void;
}

const ArtifactsView: React.FC<ArtifactsViewProps> = ({ artifacts, onAddArtifact }) => {
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
        uploadDate: new Date().toLocaleDateString()
      };
      onAddArtifact(newArtifact);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Artifact Vault</h2>
          <p className="text-slate-500">Evidence for your license portfolio.</p>
        </div>
        <label className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-sm hover:bg-indigo-700 transition-all flex items-center space-x-2 cursor-pointer">
          <span>+ Upload Evidence</span>
          <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
        </label>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {artifacts.map(artifact => (
          <div key={artifact.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="aspect-square bg-slate-100 flex items-center justify-center relative overflow-hidden">
              {artifact.type.startsWith('image') ? (
                <img src={artifact.data} alt={artifact.name} className="object-cover w-full h-full" />
              ) : (
                <span className="text-4xl">📄</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button className="p-2 bg-white rounded-lg text-slate-800 hover:bg-blue-50">👁️</button>
                <button className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50">🗑️</button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-bold text-slate-700 truncate">{artifact.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{artifact.uploadDate}</p>
            </div>
          </div>
        ))}

        {artifacts.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-lg font-bold text-slate-600">No artifacts uploaded</h3>
            <p className="text-slate-400">Add photos or PDFs from your meetings and activities.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtifactsView;
