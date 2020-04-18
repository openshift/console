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

const mockWorkspacesData = {
  workspaces: [
    {
      name: 'mock-workspace-1',
      type: 'Secret',
      data: {
        secret: {
          secretName: 'mock-secret',
        },
      },
    },
    {
      name: 'mock-workspace-2',
      type: 'ConfigMap',
      data: {
        configMap: {
          name: 'mock-configmap',
          items: [
            {
              key: 'mock-key',
              path: 'mock-path',
            },
          ],
        },
      },
    },
    {
      name: 'mock-workspace-3',
      type: 'PVC',
      data: {
        persistentVolumeClaim: {
          claimName: 'mock-pvc',
        },
      },
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

  it('should validate workspaces form validation schema', async () => {
    const mockData = cloneDeep(mockWorkspacesData);
    await resourcesValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
  });
});
