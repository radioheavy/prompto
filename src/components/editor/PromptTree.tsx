'use client';

import { usePromptStore } from '@/lib/store/promptStore';
import { jsonToTree } from '@/lib/json/traverser';
import { TreeNodeComponent } from './TreeNode';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

export function PromptTree() {
  const { getCurrentPrompt, expandedPaths, expandAll, collapseAll, addObjectKey } =
    usePromptStore();

  const prompt = getCurrentPrompt();

  if (!prompt) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No prompt selected
      </div>
    );
  }

  const tree = jsonToTree(prompt.content, expandedPaths);

  const handleAddRootKey = () => {
    const key = window.prompt('Enter key name:');
    if (key) {
      addObjectKey([], key, '');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b">
        <Button variant="ghost" size="sm" onClick={expandAll}>
          <ChevronDown className="h-4 w-4 mr-1" />
          Expand All
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          <ChevronRight className="h-4 w-4 mr-1" />
          Collapse All
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleAddRootKey}>
          <Plus className="h-4 w-4 mr-1" />
          Add Key
        </Button>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {tree.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Empty prompt</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleAddRootKey}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add your first key
              </Button>
            </div>
          ) : (
            tree.map((node) => (
              <TreeNodeComponent key={node.id} node={node} depth={0} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
