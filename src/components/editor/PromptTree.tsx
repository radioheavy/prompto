'use client';

import { usePromptStore } from '@/lib/store/promptStore';
import { jsonToTree } from '@/lib/json/traverser';
import { TreeNodeComponent } from './TreeNode';
import { ChevronDown, ChevronRight, Plus, Info } from 'lucide-react';
import { useState } from 'react';

export function PromptTree() {
  const { getCurrentPrompt, expandedPaths, expandAll, collapseAll, addObjectKey } =
    usePromptStore();
  const [showTip, setShowTip] = useState(true);

  const prompt = getCurrentPrompt();

  if (!prompt) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Prompt seçilmedi
      </div>
    );
  }

  const tree = jsonToTree(prompt.content, expandedPaths);

  const handleAddRootKey = () => {
    const key = window.prompt('Alan adı girin:');
    if (key) {
      addObjectKey([], key, '');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 flex items-center gap-1 px-2 border-b shrink-0">
        <button
          onClick={expandAll}
          className="h-8 px-2 text-xs rounded hover:bg-muted transition-colors flex items-center gap-1"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Aç
        </button>
        <button
          onClick={collapseAll}
          className="h-8 px-2 text-xs rounded hover:bg-muted transition-colors flex items-center gap-1"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          Kapat
        </button>
        <div className="flex-1" />
        <button
          onClick={handleAddRootKey}
          className="h-8 px-3 text-xs rounded border hover:bg-muted transition-colors flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Ekle
        </button>
      </div>

      {/* Help Tip */}
      {showTip && tree.length > 0 && (
        <div className="mx-2 mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="text-muted-foreground">
              Değere tıkla → düzenle | Hover → sil/ekle
            </span>
          </div>
          <button
            onClick={() => setShowTip(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="mb-3">Boş prompt</p>
            <button
              onClick={handleAddRootKey}
              className="px-4 py-2 text-sm rounded border hover:bg-muted transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              İlk alanı ekle
            </button>
          </div>
        ) : (
          tree.map((node) => (
            <TreeNodeComponent key={node.id} node={node} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}
