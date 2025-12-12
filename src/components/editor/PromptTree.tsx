'use client';

import { usePromptStore } from '@/lib/store/promptStore';
import { jsonToTree } from '@/lib/json/traverser';
import { TreeNodeComponent } from './TreeNode';
import { ChevronDown, ChevronRight, Plus, Layers, X } from 'lucide-react';
import { useState } from 'react';

export function PromptTree() {
  const { getCurrentPrompt, expandedPaths, expandAll, collapseAll, addObjectKey } =
    usePromptStore();
  const [showTip, setShowTip] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const prompt = getCurrentPrompt();

  if (!prompt) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400">
        Prompt seçilmedi
      </div>
    );
  }

  const tree = jsonToTree(prompt.content, expandedPaths);

  const handleAddRootKey = () => {
    setNewKeyName('');
    setShowAddModal(true);
  };

  const confirmAddKey = () => {
    if (newKeyName.trim()) {
      addObjectKey([], newKeyName.trim(), '');
      setShowAddModal(false);
      setNewKeyName('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-11 flex items-center gap-1 px-3 border-b border-neutral-100 shrink-0">
        <button
          onClick={expandAll}
          className="h-7 w-7 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors flex items-center justify-center"
          title="Tümünü genişlet"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          onClick={collapseAll}
          className="h-7 w-7 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors flex items-center justify-center"
          title="Tümünü daralt"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <button
          onClick={handleAddRootKey}
          className="h-7 px-3 text-xs rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors flex items-center gap-1.5 font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Ekle
        </button>
      </div>

      {/* Help Tip */}
      {showTip && tree.length > 0 && (
        <div className="mx-3 mt-3 p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
            <Layers className="h-3.5 w-3.5 text-sky-600" />
          </div>
          <div className="flex-1 pt-0.5">
            <span className="text-neutral-600">
              <span className="font-medium text-neutral-700">Değere tıkla</span> → düzenle | <span className="font-medium text-neutral-700">Hover</span> → sil/ekle
            </span>
          </div>
          <button
            onClick={() => setShowTip(false)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-3">
        {tree.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Layers className="h-7 w-7 text-neutral-300" />
            </div>
            <p className="text-neutral-500 mb-4 font-medium">Boş prompt</p>
            <button
              onClick={handleAddRootKey}
              className="px-4 py-2.5 text-sm rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors inline-flex items-center gap-2 font-medium"
            >
              <Plus className="h-4 w-4" />
              İlk alanı ekle
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {tree.map((node) => (
              <TreeNodeComponent key={node.id} node={node} depth={0} />
            ))}
          </div>
        )}
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-4 mx-4 w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-neutral-800">Yeni Alan Ekle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAddKey();
                if (e.key === 'Escape') setShowAddModal(false);
              }}
              placeholder="Alan adı..."
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={confirmAddKey}
                disabled={!newKeyName.trim()}
                className="flex-1 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ekle
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
