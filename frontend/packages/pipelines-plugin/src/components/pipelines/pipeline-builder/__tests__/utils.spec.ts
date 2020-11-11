import { PipelineResourceTaskParam } from '../../../../utils/pipeline-augment';
import { taskParamIsRequired } from '../utils';

describe('taskParamIsRequired properly detects what is required', () => {
  const structure: PipelineResourceTaskParam = {
    name: 'test-param',
    description: 'some description',
    type: 'string',
  };

  it('expect an empty param to result in needing a default', () => {
    expect(taskParamIsRequired({} as any)).toBe(true);
  });

  it('expect no default property to mean required', () => {
    expect(taskParamIsRequired(structure)).toBe(true);
  });

  it('expect a string default of a truthy value to mean not required', () => {
    expect(taskParamIsRequired({ ...structure, default: 'truthy' })).toBe(false);
  });

  it('expect an empty string default to mean not required', () => {
    expect(taskParamIsRequired({ ...structure, default: '' })).toBe(false);
  });

  it('expect an array default to always be not required', () => {
    expect(taskParamIsRequired({ ...structure, type: 'array', default: [] })).toBe(false);
  });
});
