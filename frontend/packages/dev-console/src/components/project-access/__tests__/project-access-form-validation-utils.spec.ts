import { cloneDeep } from 'lodash';
import { validationSchema } from '../project-access-form-validation-utils';
import { mockProjectAccessData } from './project-access-form-data';

describe('ValidationUtils', () => {
  it('should throw an error if Name field is empty', async () => {
    const mockData = cloneDeep(mockProjectAccessData);
    mockData.projectAccess[0].user = '';

    await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
    await validationSchema.validate(mockData).catch((err) => {
      expect(err.message).toBe('Required');
      expect(err.type).toBe('required');
    });
  });

  it('should throw an error if no Role is selected ', async () => {
    const mockData = cloneDeep(mockProjectAccessData);
    mockData.projectAccess[0].role = '';

    await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
    await validationSchema.validate(mockData).catch((err) => {
      expect(err.message).toBe('Required');
      expect(err.type).toBe('required');
    });
  });
});
