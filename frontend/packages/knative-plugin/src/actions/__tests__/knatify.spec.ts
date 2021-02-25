import { deploymentData } from '../../utils/__tests__/knative-serving-data';
import { hideKnatifyAction } from '../knatify';

describe('knatify', () => {
  it('hideKnatifyAction should return false is Workload standalone and avilable', () => {
    expect(hideKnatifyAction(deploymentData)).toBe(false);
  });

  it('hideKnatifyAction should return true is Workload standalone and not avilable', () => {
    const mockDeploymentData = {
      ...deploymentData,
      status: {
        ...deploymentData.status,
        conditions: [
          {
            type: 'Progressing',
            status: 'False',
            lastUpdateTime: '2019-09-24T11:21:14Z',
            lastTransitionTime: '2019-09-24T11:21:03Z',
            reason: 'NewReplicaSetAvailable',
            message: 'ReplicaSet "overlayimage-54b47fbb75" has successfully progressed.',
          },
        ],
      },
    };
    expect(hideKnatifyAction(mockDeploymentData)).toBe(true);
  });

  it('hideKnatifyAction should return true is Workload not standalone and avilable', () => {
    const mockDeploymentData = {
      ...deploymentData,
      metadata: {
        ...deploymentData.metadata,
        ownerReferences: [
          {
            apiVersion: 'camel.apache.org/v1',
            kind: 'Integration',
            name: 'overlayimage-f56hh',
            uid: 'c1b802c8-42ff-4224-824f-5d454814ab01',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
    };
    expect(hideKnatifyAction(mockDeploymentData)).toBe(true);
  });

  it('hideKnatifyAction should return true is Workload not standalone and not avilable', () => {
    const mockDeploymentData = {
      ...deploymentData,
      metadata: {
        ...deploymentData.metadata,
        ownerReferences: [
          {
            apiVersion: 'camel.apache.org/v1',
            kind: 'Integration',
            name: 'overlayimage-f56hh',
            uid: 'c1b802c8-42ff-4224-824f-5d454814ab01',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      status: {
        ...deploymentData.status,
        conditions: [
          {
            type: 'Progressing',
            status: 'False',
            lastUpdateTime: '2019-09-24T11:21:14Z',
            lastTransitionTime: '2019-09-24T11:21:03Z',
            reason: 'NewReplicaSetAvailable',
            message: 'ReplicaSet "overlayimage-54b47fbb75" has successfully progressed.',
          },
        ],
      },
    };
    expect(hideKnatifyAction(mockDeploymentData)).toBe(true);
  });
});
