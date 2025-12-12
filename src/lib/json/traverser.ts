import { JsonValue, JsonObject, TreeNode } from '@/types/prompt';
import { getValueType, pathToString } from './updater';
import { v4 as uuidv4 } from 'uuid';

/**
 * Convert a JSON object to a tree structure for rendering
 */
export function jsonToTree(
  obj: JsonObject,
  expandedPaths: string[] = []
): TreeNode[] {
  const isExpandAll = expandedPaths.includes('__all__');

  function traverse(
    value: JsonValue,
    key: string,
    path: string[]
  ): TreeNode {
    const type = getValueType(value);
    const pathString = pathToString(path);
    const isExpanded = isExpandAll || expandedPaths.includes(pathString);

    const node: TreeNode = {
      id: uuidv4(),
      key,
      value,
      type,
      path,
      isExpanded,
    };

    if (type === 'object' && value !== null) {
      node.children = Object.entries(value as JsonObject).map(([k, v]) =>
        traverse(v, k, [...path, k])
      );
    } else if (type === 'array' && Array.isArray(value)) {
      node.children = value.map((v, i) =>
        traverse(v, String(i), [...path, String(i)])
      );
    }

    return node;
  }

  // Start from root object
  return Object.entries(obj).map(([key, value]) =>
    traverse(value, key, [key])
  );
}

/**
 * Get all expandable paths from a JSON object
 */
export function getAllExpandablePaths(obj: JsonObject): string[] {
  const paths: string[] = [];

  function traverse(value: JsonValue, path: string[]) {
    const type = getValueType(value);

    if (type === 'object' && value !== null) {
      paths.push(pathToString(path));
      Object.entries(value as JsonObject).forEach(([k, v]) => {
        traverse(v, [...path, k]);
      });
    } else if (type === 'array' && Array.isArray(value)) {
      paths.push(pathToString(path));
      value.forEach((v, i) => {
        traverse(v, [...path, String(i)]);
      });
    }
  }

  Object.entries(obj).forEach(([key, value]) => {
    traverse(value, [key]);
  });

  return paths;
}

/**
 * Count total nodes in a tree
 */
export function countNodes(obj: JsonObject): number {
  let count = 0;

  function traverse(value: JsonValue) {
    count++;
    const type = getValueType(value);

    if (type === 'object' && value !== null) {
      Object.values(value as JsonObject).forEach(traverse);
    } else if (type === 'array' && Array.isArray(value)) {
      value.forEach(traverse);
    }
  }

  Object.values(obj).forEach(traverse);
  return count;
}

/**
 * Format a value for display
 */
export function formatValue(value: JsonValue): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (value.length > 50) {
      return `"${value.substring(0, 47)}..."`;
    }
    return `"${value}"`;
  }
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `{${keys.length} keys}`;
  }
  return String(value);
}
