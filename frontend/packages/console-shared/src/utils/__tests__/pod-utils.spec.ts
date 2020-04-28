import * as utils from '@console/internal/components/utils';
import {
  isIdled,
  isKnativeServing,
  getPodStatus,
  getPodData,
  checkPodEditAccess,
  isContainerLoopingFilter,
} from '../pod-utils';
import {
  deploymentConfig,
  notIdledDeploymentConfig,
  deployment,
  mockPod,
  statefulSets,
  allpods,
} from '../__mocks__/pod-utils-test-data';
import { PodControllerOverviewItem } from '../../types';
import { DeploymentConfigModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';

describe('Pod Utils:', () => {
  it('isIdle should return true', () => {
    expect(isIdled(deploymentConfig)).toBe(true);
  });

  it('isIdle should return false', () => {
    expect(isIdled(notIdledDeploymentConfig)).toBe(false);
  });

  it('isKnative serving should return true', () => {
    expect(isKnativeServing(deployment, 'metadata.labels')).toBe(true);
  });

  it('getPodStatus should return `running` phase', () => {
    expect(getPodStatus(mockPod)).toBe('Running');
  });

  it('getPodStatus should return `terminating` phase', () => {
    const mData = { ...mockPod, metadata: { deletionTimestamp: 'mock' } };
    expect(getPodStatus(mData)).toBe('Terminating');
  });

  it('getPodStatus should return `pending` phase', () => {
    const mData = { ...mockPod, status: { phase: 'Pending' } };
    expect(getPodStatus(mData)).toBe('Pending');
  });

  it('should return CrashLoopBackOff status', () => {
    const mData = {
      ...mockPod,
      status: {
        phase: 'Running',
        containerStatuses: [{ state: { waiting: { reason: 'CrashLoopBackOff' } } }],
      },
    };
    expect(getPodStatus(mData)).toBe('CrashLoopBackOff');
  });

  it('isContainerLoopingFilter should return true', () => {
    const containerStatus = { state: { waiting: { reason: 'CrashLoopBackOff' } } };
    expect(isContainerLoopingFilter(containerStatus)).toBe(true);
  });

  it('should return pods if there are no rolling strategy', () => {
    const current: PodControllerOverviewItem = { pods: [], alerts: {}, revision: 0, obj: {} };
    const previous: PodControllerOverviewItem = { pods: [], alerts: {}, revision: 0, obj: {} };
    expect(getPodData(statefulSets, allpods, current, previous, false)).toEqual({
      inProgressDeploymentData: null,
      completedDeploymentData: allpods,
    });
  });

  it('should return pods from current during scaling (Deployment anotation complete)', () => {
    const current: PodControllerOverviewItem = {
      pods: [],
      alerts: {},
      revision: 0,
      obj: {},
      phase: 'Complete',
    };
    const previous: PodControllerOverviewItem = { pods: allpods, alerts: {}, revision: 0, obj: {} };
    expect(getPodData(deploymentConfig, allpods, current, previous, false)).toEqual({
      inProgressDeploymentData: null,
      completedDeploymentData: [],
    });
  });

  it('should return pods in both `inProgressDeploymentData` `completedDeploymentData` during a rollout', () => {
    const current: PodControllerOverviewItem = {
      pods: [],
      alerts: {},
      revision: 0,
      obj: {},
    };
    const previous: PodControllerOverviewItem = { pods: allpods, alerts: {}, revision: 0, obj: {} };
    expect(getPodData(deploymentConfig, allpods, current, previous, true)).toEqual({
      inProgressDeploymentData: [],
      completedDeploymentData: allpods,
    });
  });
});

describe('checkPodEditAccess', () => {
  let obj: K8sResourceKind;

  beforeEach(() => {
    obj = {
      metadata: {
        name: 'abc',
        namespace: 'ts',
      },
      spec: {},
      status: {},
    };
  });

  it('should have access true if check Access return allowed true', (done) => {
    jest
      .spyOn(utils, 'checkAccess')
      .mockImplementation(() => Promise.resolve({ status: { allowed: true } }));
    checkPodEditAccess(obj, DeploymentConfigModel, undefined)
      .then((resp) => {
        expect(resp.status.allowed).toBe(true);
        done();
      })
      .catch(() => {});
  });

  it('should have access false if check Access return allowed false', (done) => {
    jest
      .spyOn(utils, 'checkAccess')
      .mockImplementation(() => Promise.resolve({ status: { allowed: false } }));
    checkPodEditAccess(obj, DeploymentConfigModel, undefined)
      .then((resp) => {
        expect(resp.status.allowed).toBe(false);
        done();
      })
      .catch(() => {});
  });
});
