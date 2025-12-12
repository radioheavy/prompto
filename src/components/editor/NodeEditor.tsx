'use client';

import { TreeNode, JsonValue } from '@/types/prompt';
import { usePromptStore } from '@/lib/store/promptStore';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface NodeEditorProps {
  node: TreeNode;
  onClose: () => void;
}

export function NodeEditor({ node, onClose }: NodeEditorProps) {
  const { updateValue } = usePromptStore();
  const [value, setValue] = useState<string>(
    typeof node.value === 'string'
      ? node.value
      : JSON.stringify(node.value)
  );
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (inputRef.current instanceof HTMLInputElement) {
      inputRef.current.select();
    }
  }, []);

  const handleSave = () => {
    let parsedValue: JsonValue;

    switch (node.type) {
      case 'string':
        parsedValue = value;
        break;
      case 'number':
        parsedValue = parseFloat(value) || 0;
        break;
      case 'boolean':
        parsedValue = value === 'true';
        break;
      case 'null':
        parsedValue = null;
        break;
      default:
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }
    }

    updateValue(node.path, parsedValue);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Boolean uses switch
  if (node.type === 'boolean') {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={node.value as boolean}
          onCheckedChange={(checked) => {
            updateValue(node.path, checked);
            onClose();
          }}
        />
        <span className="text-sm">{node.value ? 'true' : 'false'}</span>
      </div>
    );
  }

  // String with long content uses textarea
  if (node.type === 'string' && typeof node.value === 'string' && node.value.length > 50) {
    return (
      <div className="flex flex-col gap-2 w-full" onClick={(e) => e.stopPropagation()}>
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] text-sm"
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Default: simple input
  return (
    <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={node.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="h-7 text-sm"
      />
    </div>
  );
}
