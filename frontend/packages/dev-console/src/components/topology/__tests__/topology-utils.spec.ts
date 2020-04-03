import * as _ from 'lodash';
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
import { serviceBindingRequest } from './service-binding-test-data';

describe('Topology Utils', () => {
  beforeAll(() => {
    jest.spyOn(k8s, 'k8sCreate').mockImplementation((data) => Promise.resolve({ data }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should create topology resource service binding', (done) => {
    const source = topologyDataModel.topology['e187afa2-53b1-406d-a619-cf9ff1468031'];
    const target = topologyDataModel.topology['e187afa2-53b1-406d-a619-cf9ff1468032'];
    createTopologyResourceConnection(source, target, null, true)
      .then((resp) => {
        const data = _.get(resp, 'data');
        expect(data).toEqual(serviceBindingRequest.data);
        done();
      })
      .catch(() => {
        done();
      });
  });

  it('should return true for nodes created by helm charts', () => {
    expect(isHelmReleaseNode(sampleDeploymentConfigs.data[0], sampleHelmResourcesMap)).toBe(false);
    expect(isHelmReleaseNode(sampleHelmChartDeploymentConfig, sampleHelmResourcesMap)).toBe(true);
  });

  it('should return topology resource object', () => {
    const topologyResourceObject = getTopologyResourceObject(
      topologyDataModel.topology['e187afa2-53b1-406d-a619-cf9ff1468031'],
    );
    expect(topologyResourceObject).toEqual(sampleDeployments.data[0]);
  });
});
