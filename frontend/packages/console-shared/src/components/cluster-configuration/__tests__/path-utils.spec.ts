import { extractValue, wrapValue } from '../path-utils';

describe('extractValue', () => {
  it('should return the value when no path is defined', () => {
    expect(extractValue('value', '')).toBe('value');
  });

  it('should return the value when path contains just empty parts', () => {
    expect(extractValue('value', '/')).toBe('value');
    expect(extractValue('value', '//')).toBe('value');
  });

  it('should return the value when path is correct', () => {
    expect(extractValue({ a: 'value' }, 'a')).toBe('value');
    expect(extractValue({ a: 'value' }, '/a')).toBe('value');
    expect(extractValue({ a: { b: 'value' } }, 'a/b')).toBe('value');
    expect(extractValue({ a: { b: 'value' } }, '/a/b/')).toBe('value');
  });

  it('should return null if the property is not defined', () => {
    expect(extractValue({ a: 'value' }, 'b')).toBe(null);
    expect(extractValue({ a: 'value' }, '/b')).toBe(null);
    expect(extractValue({ a: { b: 'value' } }, 'a/c')).toBe(null);
    expect(extractValue({ a: { b: 'value' } }, '/a/c/')).toBe(null);
    expect(extractValue({ a: { b: 'value' } }, 'b/b')).toBe(null);
    expect(extractValue({ a: { b: 'value' } }, '/b/b/')).toBe(null);
  });

  it('should support alternative separator', () => {
    expect(extractValue({ a: { b: 'value' } }, 'a.b', '.')).toBe('value');
  });

  it('must not return toString or other functions from the object', () => {
    expect(extractValue({ a: 'value' }, '/toString')).toBe(null);
  });
});

describe('wrapValue', () => {
  it('should return the value when no path is defined', () => {
    expect(wrapValue('value', '')).toBe('value');
  });

  it('should return the value when path contains just empty parts', () => {
    expect(wrapValue('value', '/')).toBe('value');
    expect(wrapValue('value', '//')).toBe('value');
  });

  it('should wrap the value when path is correct', () => {
    expect(wrapValue('value', 'a')).toEqual({ a: 'value' });
    expect(wrapValue('value', '/a')).toEqual({ a: 'value' });
    expect(wrapValue('value', 'a/b')).toEqual({ a: { b: 'value' } });
    expect(wrapValue('value', '/a/b/')).toEqual({ a: { b: 'value' } });
  });

  it('should support alternative separator', () => {
    expect(wrapValue('value', 'a.b', '.')).toEqual({ a: { b: 'value' } });
  });
});
