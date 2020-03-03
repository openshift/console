import { cloneDeep } from 'lodash';
import {
  parametersValidationSchema,
  resourcesValidationSchema,
} from '../pipelineForm-validation-utils';

const mockParametersData = {
  parameters: [
    {
      name: 'mock-param',
      description: 'it is mock param',
      default: 'mockery',
    },
  ],
};

const mockResourcesData = {
  resources: [
    {
      name: 'mock-resource',
      type: 'Git',
    },
  ],
};

describe('pipeline form validation utils', () => {
  it('should validate parameters validation schema', async () => {
    const mockData = cloneDeep(mockParametersData);
    await parametersValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
  });

  it('should validate resources form validation schema', async () => {
    const mockData = cloneDeep(mockResourcesData);
    await resourcesValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
  });
});
