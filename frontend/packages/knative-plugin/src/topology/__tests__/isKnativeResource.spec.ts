import { isKnativeResource } from '../isKnativeResource';
import {
  knSinkDeployment,
  knSourceDeployment,
  modelsKnTopology,
} from './__mocks__/knativeResourcesData';
import { MockKnativeResources } from './topology-knative-test-data';

describe('isKnativeResource', () => {
  it('Should not depicte if no node eists', () => {
    const isKnRes = isKnativeResource(knSinkDeployment, { nodes: [], edges: [] });
    expect(isKnRes).toBeFalsy();
  });

  it('Should depicte deployment and if it is an underlying deployment for knative sink (kamelet type sink)', () => {
    const isKnRes = isKnativeResource(knSinkDeployment, modelsKnTopology);
    expect(isKnRes).toBeTruthy();
  });

  it('Should not depicte if resource is non Deployment', () => {
    const isKnRes = isKnativeResource(MockKnativeResources.brokers.data[0], modelsKnTopology);
    expect(isKnRes).toBeFalsy();
  });

  it('Should depicte deployment and if it is an underlying deployment for knative source (kamelet type source)', () => {
    const isKnRes = isKnativeResource(knSourceDeployment, modelsKnTopology);
    expect(isKnRes).toBeTruthy();
  });
});
