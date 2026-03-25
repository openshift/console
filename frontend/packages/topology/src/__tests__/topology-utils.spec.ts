import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import type { OdcNodeModel } from '../topology-types';
import {
  createTopologyResourceConnection,
  getTopologyResourceObject,
} from '../utils/topology-utils';
import { topologyDataModel } from './topology-test-data';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sPatch: jest.fn(),
}));

const k8sPatchMock = k8sResourceModule.k8sPatch as jest.Mock;

describe('Topology Utils', () => {
  let patchData = null;
  beforeEach(() => {
    patchData = null;
    k8sPatchMock.mockImplementation((model, item, patch) => {
      patchData = patch;
      return Promise.resolve();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create topology visual connector', async () => {
    const source = (topologyDataModel.nodes[0] as OdcNodeModel).resource;
    const target = (topologyDataModel.nodes[1] as OdcNodeModel).resource;
    await createTopologyResourceConnection(source, target, null).catch(() => {
      // Expected, network request failure for update
    });
    const expectedConnectsToValue = [
      target.metadata.labels['app.kubernetes.io/instance'],
      {
        apiVersion: target.apiVersion,
        kind: target.kind,
        name: target.metadata.name,
      },
    ];
    const expectedPatchData = {
      op: 'replace',
      path: '/metadata/annotations',
      value: {
        'app.openshift.io/connects-to': JSON.stringify(expectedConnectsToValue),
      },
    };

    expect(patchData[0]).toEqual(expectedPatchData);
  });

  it('should return topology resource object', () => {
    const topologyResourceObject = getTopologyResourceObject(topologyDataModel.nodes[0].data);
    expect(topologyResourceObject).toEqual(sampleDeployments.data[0]);
  });
});
