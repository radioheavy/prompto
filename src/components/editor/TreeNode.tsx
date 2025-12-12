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
  Pencil,
} from 'lucide-react';
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
  string: 'text-emerald-600',
  number: 'text-sky-600',
  boolean: 'text-violet-600',
  null: 'text-neutral-400',
  array: 'text-amber-600',
  object: 'text-rose-500',
};

const typeBgColors = {
  string: 'bg-emerald-50',
  number: 'bg-sky-50',
  boolean: 'bg-violet-50',
  null: 'bg-neutral-50',
  array: 'bg-amber-50',
  object: 'bg-rose-50',
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
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

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
    deleteValue(node.path);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'object') {
      setNewKeyName('');
      setIsAddingKey(true);
      if (!isExpanded) {
        toggleExpanded(pathString);
      }
    } else if (node.type === 'array') {
      addArrayItem(node.path, '');
      if (!isExpanded) {
        toggleExpanded(pathString);
      }
    }
  };

  const confirmAddKey = () => {
    if (newKeyName.trim()) {
      addObjectKey(node.path, newKeyName.trim(), '');
      setIsAddingKey(false);
      setNewKeyName('');
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all duration-150',
          'hover:bg-neutral-100',
          isSelected && 'bg-violet-50 hover:bg-violet-100',
          isEditing && 'ring-2 ring-violet-500 bg-violet-50'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand/Collapse button */}
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {isExpandable ? (
            <button
              onClick={handleToggle}
              className="hover:bg-neutral-200 rounded-md p-0.5 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-neutral-500" />
              )}
            </button>
          ) : null}
        </div>

        {/* Type icon with background */}
        <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', typeBgColors[node.type])}>
          <Icon className={cn('h-3.5 w-3.5', typeColors[node.type])} />
        </div>

        {/* Key name */}
        <span className="font-medium text-sm text-neutral-700">{node.key}</span>
        <span className="text-neutral-300 mx-0.5">:</span>

        {/* Value or editor */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <NodeEditor node={node} onClose={() => setEditingPath(null)} />
          ) : node.type === 'object' || node.type === 'array' ? (
            <span className="text-xs text-neutral-400 font-medium">
              {node.type === 'array'
                ? `[${node.children?.length || 0} öğe]`
                : `{${node.children?.length || 0} alan}`}
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingPath(node.path);
              }}
              className={cn(
                'text-sm truncate text-left px-2 py-0.5 rounded-lg transition-all max-w-full font-medium',
                'hover:bg-white hover:shadow-sm',
                typeColors[node.type]
              )}
              title="Düzenlemek için tıkla"
            >
              {formatValue(node.value)}
            </button>
          )}
        </div>

        {/* Actions */}
        {isHovered && !isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Edit button for primitive values */}
            {node.type !== 'object' && node.type !== 'array' && (
              <button
                className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPath(node.path);
                }}
                title="Düzenle"
              >
                <Pencil className="h-3 w-3 text-neutral-400" />
              </button>
            )}
            {/* Add child for objects/arrays */}
            {isExpandable && (
              <button
                className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-violet-100 transition-colors"
                onClick={handleAddChild}
                title="Yeni ekle"
              >
                <Plus className="h-3 w-3 text-violet-500" />
              </button>
            )}
            {/* Delete */}
            <button
              className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
              onClick={handleDelete}
              title="Sil"
            >
              <Trash2 className="h-3 w-3 text-red-400" />
            </button>
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

      {/* Inline Add Key Input */}
      {isAddingKey && (
        <div
          className="flex items-center gap-2 py-1.5 px-2"
          style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
        >
          <div className="w-5 h-5" />
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Plus className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmAddKey();
              if (e.key === 'Escape') setIsAddingKey(false);
            }}
            onBlur={() => {
              if (!newKeyName.trim()) setIsAddingKey(false);
            }}
            placeholder="Alan adı..."
            className="flex-1 px-2 py-1 text-sm rounded-lg border border-emerald-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-white"
            autoFocus
          />
          <button
            onClick={confirmAddKey}
            disabled={!newKeyName.trim()}
            className="h-6 px-2 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-50"
          >
            Ekle
          </button>
          <button
            onClick={() => setIsAddingKey(false)}
            className="h-6 w-6 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 flex items-center justify-center"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
