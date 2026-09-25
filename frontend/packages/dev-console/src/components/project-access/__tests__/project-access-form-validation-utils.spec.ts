import { cloneDeep } from 'lodash';
import { validationSchema } from '../project-access-form-validation-utils';
import { mockProjectAccessData } from './project-access-form-data';

describe('ValidationUtils', () => {
  it('should throw an error if Name field is empty', async () => {
    const mockData = cloneDeep(mockProjectAccessData);
    mockData.projectAccess[0].subject.name = '';

    expect(await validationSchema.isValid(mockData)).toEqual(false);
    await expect(validationSchema.validate(mockData)).rejects.toMatchObject({
      message: 'Required',
      type: 'required',
    });
  });

  it('should throw an error if no Role is selected', async () => {
    const mockData = cloneDeep(mockProjectAccessData);
    mockData.projectAccess[0].role = '';

    expect(await validationSchema.isValid(mockData)).toEqual(false);
    await expect(validationSchema.validate(mockData)).rejects.toMatchObject({
      message: 'Required',
      type: 'required',
    });
  });
});
