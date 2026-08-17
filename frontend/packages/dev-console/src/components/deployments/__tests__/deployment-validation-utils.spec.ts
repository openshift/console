import { cloneDeep } from 'lodash';
import { LifecycleAction } from '../deployment-strategy/utils/types';
import { validationSchema } from '../utils/deployment-validation-utils';
import { mockEditDeploymentData } from './deployment-data';

describe('Validation Schema', () => {
  it('should validate the form data', async () => {
    const mockData = cloneDeep(mockEditDeploymentData);
    await validationSchema()
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(true));
  });

  it('should throw error for required lifecycle hook fields if empty', async () => {
    const mockData = cloneDeep(mockEditDeploymentData);
    const mockFormData = cloneDeep(mockEditDeploymentData.formData);
    mockFormData.deploymentStrategy.rollingParams.pre.isAddingLch = true;
    mockData.formData = mockFormData;
    await validationSchema()
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(false));
    await expect(validationSchema().validate(mockData)).rejects.toMatchObject({
      errors: ['Required', 'Required'],
    });
    mockFormData.deploymentStrategy.rollingParams.pre.action = LifecycleAction.tagImages;
    mockData.formData = mockFormData;
    await validationSchema()
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(false));
    await expect(validationSchema().validate(mockData)).rejects.toMatchObject({
      errors: ['Required', 'Required', 'Required'],
    });
  });

  it('should throw error for required images section fields if empty', async () => {
    const mockData = cloneDeep(mockEditDeploymentData);
    const mockFormData = cloneDeep(mockEditDeploymentData.formData);
    mockFormData.imageStream = { namespace: '', image: '', tag: '' };
    mockFormData.isi.name = '';
    mockData.formData = mockFormData;
    await validationSchema()
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(false));
    await expect(validationSchema().validate(mockData)).rejects.toMatchObject({
      errors: ['Required', 'Required', 'Required', 'Required'],
    });
    mockFormData.fromImageStreamTag = false;
    mockFormData.imageName = '';
    mockData.formData = mockFormData;
    await validationSchema()
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(false));
    await expect(validationSchema().validate(mockData)).rejects.toMatchObject({
      errors: ['Required'],
    });
  });
});
