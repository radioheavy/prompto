import { JsonValue, JsonObject } from '@/types/prompt';

/**
 * Immutably set a value at a given path in a JSON object
 */
export function setValueAtPath(
  obj: JsonObject,
  path: string[],
  value: JsonValue
): JsonObject {
  if (path.length === 0) {
    return value as JsonObject;
  }

  const [head, ...tail] = path;

  if (tail.length === 0) {
    return { ...obj, [head]: value };
  }

  const currentValue = obj[head];
  if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
    return {
      ...obj,
      [head]: setValueAtPath(currentValue as JsonObject, tail, value),
    };
  }

  // If the path doesn't exist, create nested objects
  return {
    ...obj,
    [head]: setValueAtPath({}, tail, value),
  };
}

/**
 * Immutably delete a value at a given path in a JSON object
 */
export function deleteValueAtPath(
  obj: JsonObject,
  path: string[]
): JsonObject {
  if (path.length === 0) {
    return obj;
  }

  const [head, ...tail] = path;

  if (tail.length === 0) {
    const { [head]: _, ...rest } = obj;
    return rest;
  }

  const currentValue = obj[head];
  if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
    return {
      ...obj,
      [head]: deleteValueAtPath(currentValue as JsonObject, tail),
    };
  }

  return obj;
}

/**
 * Get a value at a given path in a JSON object
 */
export function getValueAtPath(
  obj: JsonObject,
  path: string[]
): JsonValue | undefined {
  if (path.length === 0) {
    return obj;
  }

  let current: JsonValue = obj;
  for (const key of path) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = parseInt(key, 10);
      if (isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else {
      current = (current as JsonObject)[key];
    }
  }
  return current;
}

/**
 * Get the type of a JSON value
 */
export function getValueType(
  value: JsonValue
): 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as 'string' | 'number' | 'boolean' | 'object';
}

/**
 * Convert path array to string for comparison
 */
export function pathToString(path: string[]): string {
  return path.join('.');
}

/**
 * Convert path string back to array
 */
export function stringToPath(pathString: string): string[] {
  return pathString ? pathString.split('.') : [];
}
