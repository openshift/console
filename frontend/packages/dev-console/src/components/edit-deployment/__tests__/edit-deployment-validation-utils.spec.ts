import { cloneDeep } from 'lodash';
import { mockEditDeploymentData } from '../__mocks__/edit-deployment-data';
import { LifecycleAction } from '../deployment-strategy/utils/types';
import { validationSchema } from '../utils/edit-deployment-validation-utils';

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
    await validationSchema()
      .validate(mockData)
      .catch((err) => {
        expect(err.errors).toEqual(['Required', 'Required']);
      });
    mockFormData.deploymentStrategy.rollingParams.pre.action = LifecycleAction.tagImages;
    mockData.formData = mockFormData;
    await validationSchema()
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(false));
    await validationSchema()
      .validate(mockData)
      .catch((err) => {
        expect(err.errors).toEqual(['Required', 'Required', 'Required']);
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
    await validationSchema()
      .validate(mockData)
      .catch((err) => {
        expect(err.errors).toEqual(['Required', 'Required', 'Required', 'Required']);
      });
    mockFormData.fromImageStreamTag = false;
    mockFormData.imageName = '';
    mockData.formData = mockFormData;
    await validationSchema()
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(false));
    await validationSchema()
      .validate(mockData)
      .catch((err) => {
        expect(err.errors).toEqual(['Required']);
      });
  });
});
