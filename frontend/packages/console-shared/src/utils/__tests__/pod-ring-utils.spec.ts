import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DeploymentConfigModel } from '@console/internal/models';
import { RevisionModel } from '@console/knative-plugin';
import * as utils from '../pod-utils';
import { usePodScalingAccessStatus, podRingLabel, getFailedPods } from '../pod-ring-utils';
import { testHook } from '../../test-utils/hooks-utils';
import {
  deployment,
  deploymentConfig,
  statefulSets,
  daemonSet,
  mockPod,
} from '../__mocks__/pod-utils-test-data';
import { ExtPodKind } from '../../types';

describe('pod-ring utils:', () => {
  it('should return proper title, subtitle for podRingLabel', () => {
    const deploymentWithReplicas = _.set(_.cloneDeep(deployment), 'spec.replicas', 2);
    const mockDeploymentData = _.set(deploymentWithReplicas, 'status.readyReplicas', 2);
    expect(
      podRingLabel(mockDeploymentData, mockDeploymentData.kind, [mockPod as ExtPodKind]).title,
    ).toEqual('2');
    expect(
      podRingLabel(mockDeploymentData, mockDeploymentData.kind, [mockPod as ExtPodKind]).subTitle,
    ).toEqual('pods');
  });

  it('should return title scaled to 0, empty subtitle for podRingLabel when no pods exist', () => {
    const mockDeploymentData = _.set(_.cloneDeep(deployment), 'spec.replicas', 0);
    expect(
      podRingLabel(mockDeploymentData, mockDeploymentData.kind, [mockPod as ExtPodKind]).title,
    ).toEqual('Scaled to 0');
    expect(
      podRingLabel(mockDeploymentData, mockDeploymentData.kind, [mockPod as ExtPodKind]).subTitle,
    ).toEqual('');
  });

  it('should return title 0, subtitle scaling to 2 and titleComponent for podRingLabel when scaling from 1 to 2 pods', () => {
    const deploymentWithReplicas = _.set(_.cloneDeep(deployment), 'spec.replicas', 2);
    const mockDeploymentData = _.set(deploymentWithReplicas, 'status.readyReplicas', 1);
    const podRingLabelData = podRingLabel(mockDeploymentData, mockDeploymentData.kind, [
      mockPod as ExtPodKind,
    ]);
    expect(podRingLabelData.title).toEqual('1');
    expect(podRingLabelData.subTitle).toEqual('scaling to 2');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeTruthy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return title 0, subtitle scaling to 1 and titleComponent for podRingLabel when the first pod is being created', () => {
    const deploymentWithReplicas = _.set(_.cloneDeep(deployment), 'spec.replicas', 1);
    const mockDeploymentData = _.set(deploymentWithReplicas, 'status.readyReplicas', 0);
    const podRingLabelData = podRingLabel(mockDeploymentData, mockDeploymentData.kind, [
      mockPod as ExtPodKind,
    ]);

    expect(podRingLabelData.title).toEqual('0');
    expect(podRingLabelData.subTitle).toEqual('scaling to 1');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeTruthy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return title 0, subtitle scaling to 1 and titleComponent for podRingLabel when pod count is 1 and status is pending', () => {
    const mockDeploymentData = _.set(_.cloneDeep(deployment), 'spec.replicas', 1);
    const mockPodData = _.set(_.cloneDeep(mockPod), 'status.phase', 'Pending');
    const podRingLabelData = podRingLabel(mockDeploymentData, mockDeploymentData.kind, [
      mockPodData as ExtPodKind,
    ]);
    expect(podRingLabelData.title).toEqual('0');
    expect(podRingLabelData.subTitle).toEqual('scaling to 1');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeTruthy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return proper title, subtitle for podRingLabel for Daemon sets', () => {
    const mockDaemonData = _.cloneDeep(daemonSet);
    const podRingLabelData = podRingLabel(mockDaemonData, mockDaemonData.kind, [
      mockPod as ExtPodKind,
    ]);
    expect(podRingLabelData.title).toEqual('2');
    expect(podRingLabelData.subTitle).toEqual('pods');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeFalsy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return proper title, subtitle for podRingLabel for Deployment Config', () => {
    const deploymentConfigWithReplicas = _.set(_.cloneDeep(deploymentConfig), 'spec.replicas', 2);
    const mockDeploymentConfigData = _.set(deploymentConfigWithReplicas, 'status.readyReplicas', 2);
    const podRingLabelData = podRingLabel(mockDeploymentConfigData, mockDeploymentConfigData.kind, [
      mockPod as ExtPodKind,
    ]);
    expect(podRingLabelData.title).toEqual('2');
    expect(podRingLabelData.subTitle).toEqual('pods');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeFalsy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return proper title, subtitle for podRingLabel for Stateful sets', () => {
    const statefulSetWithReplicas = _.set(_.cloneDeep(statefulSets), 'spec.replicas', 2);
    const mockStatefulSetData = _.set(statefulSetWithReplicas, 'status.readyReplicas', 2);
    const podRingLabelData = podRingLabel(mockStatefulSetData, mockStatefulSetData.kind, [
      mockPod as ExtPodKind,
    ]);
    expect(podRingLabelData.title).toEqual('2');
    expect(podRingLabelData.subTitle).toEqual('pods');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeFalsy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return proper title, subtitle for podRingLabel for failed pods', () => {
    const mockDeploymentData = _.set(_.cloneDeep(deployment), 'spec.replicas', 1);
    const containerStatuses = [
      {
        state: {
          waiting: {
            reason: 'CrashLoopBackOff',
          },
        },
      },
    ];
    const mockFailedPod = _.set(
      _.cloneDeep(mockPod),
      'status.containerStatuses',
      containerStatuses,
    );
    const podRingLabelData = podRingLabel(mockDeploymentData, mockDeploymentData.kind, [
      mockFailedPod as ExtPodKind,
    ]);
    expect(podRingLabelData.title).toEqual('1');
    expect(podRingLabelData.subTitle).toEqual('pod');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeFalsy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });
});

describe('usePodScalingAccessStatus', () => {
  let obj: K8sResourceKind;

  beforeEach(() => {
    jest
      .spyOn(utils, 'checkPodEditAccess')
      .mockImplementation(() => Promise.resolve({ status: { allowed: false } }));
    obj = {
      kind: '',
      metadata: {},
      spec: {},
      status: {},
    };
  });

  it('should return false for scaling when enableScaling is false', (done) => {
    obj.kind = 'Deployment';
    testHook(() => {
      expect(usePodScalingAccessStatus(obj, DeploymentConfigModel, [], false)).toBe(false);
      done();
    });
  });

  it('should return false for knative revisions', (done) => {
    obj.kind = 'Revision';
    testHook(() => {
      expect(usePodScalingAccessStatus(obj, RevisionModel, [], true)).toBe(false);
      done();
    });
  });

  it('should return false when api call returns false for a resource', (done) => {
    obj.kind = 'DeploymentConfig';
    testHook(() => {
      expect(usePodScalingAccessStatus(obj, DeploymentConfigModel, [], true)).toBe(false);
      done();
    });
  });

  it('should return false when API call results in an error', (done) => {
    jest
      .spyOn(utils, 'checkPodEditAccess')
      .mockImplementation(() => Promise.reject(new Error('error')));
    testHook(() => {
      expect(usePodScalingAccessStatus(obj, DeploymentConfigModel, [], true)).toBe(false);
      done();
    });
  });
});

describe('getFailedPods', () => {
  it('should return 0 when there are no failed pods', () => {
    expect(getFailedPods([mockPod as ExtPodKind])).toEqual(0);
  });
  it('should return the number of faailed pods', () => {
    const mockFailedPod = _.set(_.cloneDeep(mockPod), 'status.containerStatuses', [
      {
        state: {
          waiting: {
            reason: 'CrashLoopBackOff',
          },
        },
      },
    ]);
    expect(getFailedPods([mockPod as ExtPodKind, mockFailedPod as ExtPodKind])).toEqual(1);
  });
});
