import * as k8s from '@console/internal/module/k8s';
import {
  createTopologyResourceConnection,
  getTopologyResourceObject,
  isHelmReleaseNode,
} from '../topology-utils';
import {
  topologyDataModel,
  sampleHelmChartDeploymentConfig,
  sampleDeploymentConfigs,
  sampleHelmResourcesMap,
  sampleDeployments,
} from './topology-test-data';

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
    const source = topologyDataModel.nodes[0].data;
    const target = topologyDataModel.nodes[1].data;
    await createTopologyResourceConnection(source, target, null).catch(() => {
      // Expected, network request failure for update
    });
    const expectedConnectsToValue = [
      target.resources.obj.metadata.labels['app.kubernetes.io/instance'],
      {
        apiVersion: target.resources.obj.apiVersion,
        kind: target.resources.obj.kind,
        name: target.resources.obj.metadata.name,
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

  it('should return true for nodes created by helm charts', () => {
    expect(isHelmReleaseNode(sampleDeploymentConfigs.data[0], sampleHelmResourcesMap)).toBe(false);
    expect(isHelmReleaseNode(sampleHelmChartDeploymentConfig, sampleHelmResourcesMap)).toBe(true);
  });

  it('should return topology resource object', () => {
    const topologyResourceObject = getTopologyResourceObject(topologyDataModel.nodes[0].data);
    expect(topologyResourceObject).toEqual(sampleDeployments.data[0]);
  });
});
