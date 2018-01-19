import { sanitizeForProm_ } from '../public/components/cluster-settings/cluster-monitoring';

describe('prom settings', () => {
  it('does not sanitize top level', () => {
    expect(sanitizeForProm_({b: ''})).toEqual({b: null});
  });

  it('sanitizes empty strings', () => {
    expect(sanitizeForProm_({a: {b: ''}})).toEqual({a: null});
  });

  it('sanitizes null values', () => {
    expect(sanitizeForProm_({b: null})).toEqual({b: null});
  });

  it('sanitizes null values', () => {
    expect(sanitizeForProm_({a: {b: 'asdf'}})).toEqual({a: {b: 'asdf'}});
  });

  it('sanitizes empty values', () => {
    expect(sanitizeForProm_({a: {b: {}}})).toEqual({a: null});
  });

  it('sanitizes null values', () => {
    expect(sanitizeForProm_({a: {b: 0}})).toEqual({a: {b: 0}});
  });

  it('sanitizes only the stuff that needs to be', () => {
    expect(sanitizeForProm_({a: {b: '', c: 'hello'}})).toEqual({a: {c: 'hello'}});
  });

  it('sanitizes everything', () => {
    expect(sanitizeForProm_({a: {b: '', c: null}})).toEqual({a: null});
  });
});
