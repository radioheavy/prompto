'use client';

import { TreeNode } from '@/types/prompt';
import { usePromptStore } from '@/lib/store/promptStore';
import { pathToString } from '@/lib/json/updater';
import { formatValue } from '@/lib/json/traverser';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Braces,
  Brackets,
  Type,
  Hash,
  ToggleLeft,
  CircleSlash,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NodeEditor } from './NodeEditor';
import { useState } from 'react';

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
}

const typeIcons = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  null: CircleSlash,
  array: Brackets,
  object: Braces,
};

const typeColors = {
  string: 'text-green-600 dark:text-green-400',
  number: 'text-blue-600 dark:text-blue-400',
  boolean: 'text-purple-600 dark:text-purple-400',
  null: 'text-gray-400',
  array: 'text-orange-600 dark:text-orange-400',
  object: 'text-cyan-600 dark:text-cyan-400',
};

export function TreeNodeComponent({ node, depth }: TreeNodeProps) {
  const {
    selectedPath,
    editingPath,
    expandedPaths,
    setSelectedPath,
    setEditingPath,
    toggleExpanded,
    deleteValue,
    addObjectKey,
    addArrayItem,
  } = usePromptStore();

  const [isHovered, setIsHovered] = useState(false);

  const pathString = pathToString(node.path);
  const isSelected =
    selectedPath && pathToString(selectedPath) === pathString;
  const isEditing =
    editingPath && pathToString(editingPath) === pathString;
  const isExpanded =
    expandedPaths.includes('__all__') || expandedPaths.includes(pathString);
  const hasChildren = node.children && node.children.length > 0;
  const isExpandable = node.type === 'object' || node.type === 'array';

  const Icon = typeIcons[node.type];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPath(node.path);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type !== 'object' && node.type !== 'array') {
      setEditingPath(node.path);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded(pathString);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${node.key}"?`)) {
      deleteValue(node.path);
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'object') {
      const key = window.prompt('Enter key name:');
      if (key) {
        addObjectKey(node.path, key, '');
        if (!isExpanded) {
          toggleExpanded(pathString);
        }
      }
    } else if (node.type === 'array') {
      addArrayItem(node.path, '');
      if (!isExpanded) {
        toggleExpanded(pathString);
      }
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent/50',
          isSelected && 'bg-accent',
          isEditing && 'ring-2 ring-primary'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand/Collapse button */}
        <div className="w-5 h-5 flex items-center justify-center">
          {isExpandable ? (
            <button
              onClick={handleToggle}
              className="hover:bg-accent rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>

        {/* Type icon */}
        <Icon className={cn('h-4 w-4', typeColors[node.type])} />

        {/* Key name */}
        <span className="font-medium text-sm">{node.key}</span>
        <span className="text-muted-foreground">:</span>

        {/* Value or editor */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <NodeEditor node={node} onClose={() => setEditingPath(null)} />
          ) : (
            <span className={cn('text-sm truncate', typeColors[node.type])}>
              {formatValue(node.value)}
            </span>
          )}
        </div>

        {/* Actions */}
        {isHovered && !isEditing && (
          <div className="flex items-center gap-1">
            {isExpandable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleAddChild}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
