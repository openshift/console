import { TektonParam } from '../../types';
import { paramIsRequired } from '../common';

describe('taskParamIsRequired properly detects what is required', () => {
  const structure: TektonParam = {
    name: 'test-param',
    description: 'some description',
    type: 'string',
  };

  it('expect an empty param to result in needing a default', () => {
    expect(paramIsRequired({} as any)).toBe(true);
  });

  it('expect no default property to mean required', () => {
    expect(paramIsRequired(structure)).toBe(true);
  });

  it('expect a string default of a truthy value to mean not required', () => {
    expect(paramIsRequired({ ...structure, default: 'truthy' })).toBe(false);
  });

  it('expect an empty string default to mean not required', () => {
    expect(paramIsRequired({ ...structure, default: '' })).toBe(false);
  });

  it('expect an array default to always be not required', () => {
    expect(paramIsRequired({ ...structure, type: 'array', default: [] })).toBe(false);
  });
});
