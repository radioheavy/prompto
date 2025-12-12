// Prompt JSON value types
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface JsonObject {
  [key: string]: JsonValue;
}

// Tree node representation
export interface TreeNode {
  id: string;
  key: string;
  value: JsonValue;
  type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';
  path: string[];
  children?: TreeNode[];
  isExpanded?: boolean;
}

// Prompt document
export interface Prompt {
  id: string;
  name: string;
  description?: string;
  content: JsonObject;
  createdAt: Date;
  updatedAt: Date;
}

// Editor state
export interface EditorState {
  selectedPath: string[] | null;
  editingPath: string[] | null;
  expandedPaths: Set<string>;
}

// AI suggestion
export interface AISuggestion {
  id: string;
  path: string[];
  originalValue: JsonValue;
  suggestedValue: JsonValue;
  explanation: string;
  confidence: number;
}

// AI response
export interface AIUpdateResponse {
  success: boolean;
  updatedValue?: JsonValue;
  explanation?: string;
  error?: string;
}
