import * as k8s from '@console/internal/module/k8s';
import { createTopologyResourceConnection, getTopologyResourceObject } from '../topology-utils';
import { topologyDataModel, sampleDeployments } from './topology-test-data';
import { OdcNodeModel } from '../topology-types';

let patchData = null;

describe('Topology Utils', () => {
  beforeAll(() => {
    jest.spyOn(k8s, 'k8sPatch').mockImplementation((model, item, patch) => {
      patchData = patch;
      return Promise.resolve();
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should create topology visual connector', async (done) => {
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
    done();
  });

  it('should return topology resource object', () => {
    const topologyResourceObject = getTopologyResourceObject(topologyDataModel.nodes[0].data);
    expect(topologyResourceObject).toEqual(sampleDeployments.data[0]);
  });
});
