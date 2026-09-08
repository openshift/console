import { parseJSONAnnotation, parseJSONArrayAnnotation } from '../annotations';

describe('parseJSONAnnotation', () => {
  it('should parse valid JSON', () => {
    const annotations = { key: '["a","b"]' };
    expect(parseJSONAnnotation(annotations, 'key')).toEqual(['a', 'b']);
  });

  it('should return defaultReturn when annotation is missing', () => {
    expect(parseJSONAnnotation({}, 'missing', undefined, [])).toEqual([]);
  });

  it('should return defaultReturn on invalid JSON and call onError', () => {
    const onError = jest.fn();
    expect(parseJSONAnnotation({ key: '{bad' }, 'key', onError, 'fallback')).toBe('fallback');
    expect(onError).toHaveBeenCalled();
  });

  it('should return undefined when annotation is missing and no default', () => {
    expect(parseJSONAnnotation({}, 'missing')).toBeUndefined();
  });
});

describe('parseJSONArrayAnnotation', () => {
  it('should return parsed array for valid JSON array of strings', () => {
    const annotations = { key: '["a","b","c"]' };
    expect(parseJSONArrayAnnotation(annotations, 'key')).toEqual(['a', 'b', 'c']);
  });

  it('should return empty array when annotation is missing', () => {
    expect(parseJSONArrayAnnotation({}, 'missing')).toEqual([]);
  });

  it('should return empty array when annotations is null', () => {
    expect(parseJSONArrayAnnotation(null, 'key')).toEqual([]);
  });

  it('should return empty array for invalid JSON and call onError', () => {
    const onError = jest.fn();
    expect(parseJSONArrayAnnotation({ key: '{bad json' }, 'key', onError)).toEqual([]);
    expect(onError).toHaveBeenCalled();
  });

  it('should return empty array when parsed value is a string, not an array', () => {
    const onError = jest.fn();
    expect(parseJSONArrayAnnotation({ key: '"just a string"' }, 'key', onError)).toEqual([]);
    expect(onError).toHaveBeenCalled();
  });

  it('should return empty array when parsed value is an object, not an array', () => {
    const onError = jest.fn();
    expect(parseJSONArrayAnnotation({ key: '{"a":"b"}' }, 'key', onError)).toEqual([]);
    expect(onError).toHaveBeenCalled();
  });

  it('should return empty array when parsed value is a number', () => {
    const onError = jest.fn();
    expect(parseJSONArrayAnnotation({ key: '42' }, 'key', onError)).toEqual([]);
    expect(onError).toHaveBeenCalled();
  });

  it('should return empty array when array contains non-string elements', () => {
    const onError = jest.fn();
    expect(parseJSONArrayAnnotation({ key: '[1, 2, 3]' }, 'key', onError)).toEqual([]);
    expect(onError).toHaveBeenCalled();
  });

  it('should return empty array for mixed array', () => {
    const onError = jest.fn();
    expect(parseJSONArrayAnnotation({ key: '["a", 1, "b"]' }, 'key', onError)).toEqual([]);
    expect(onError).toHaveBeenCalled();
  });

  it('should return empty array for empty string annotation', () => {
    expect(parseJSONArrayAnnotation({ key: '' }, 'key')).toEqual([]);
  });

  it('should not call onError when annotation is simply missing', () => {
    const onError = jest.fn();
    parseJSONArrayAnnotation({}, 'missing', onError);
    expect(onError).not.toHaveBeenCalled();
  });
});
