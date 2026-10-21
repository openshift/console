import { renderHook } from '@testing-library/react';
import * as _ from 'lodash';
import { DeploymentConfigModel, PodModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { RevisionModel } from '@console/knative-plugin';
import { t } from '../../../../../__mocks__/i18next';
import type { ExtPodKind } from '../../types';
import {
  deployment,
  deploymentConfig,
  statefulSets,
  daemonSet,
  mockPod,
} from '../__mocks__/pod-utils-test-data';
import { usePodScalingAccessStatus, podRingLabel, getFailedPods } from '../pod-ring-utils';
import * as utils from '../pod-utils';

jest.mock('../pod-utils', () => ({
  ...jest.requireActual('../pod-utils'),
  checkPodEditAccess: jest.fn(),
}));

const checkPodEditAccessMock = utils.checkPodEditAccess as jest.Mock;

describe('pod-ring utils:', () => {
  it('should return proper title, subtitle for podRingLabel', () => {
    const deploymentWithReplicas = _.set(_.cloneDeep(deployment), 'spec.replicas', 2);
    const mockDeploymentData = _.set(deploymentWithReplicas, 'status.readyReplicas', 2);
    expect(
      podRingLabel(mockDeploymentData, mockDeploymentData.kind, [mockPod as ExtPodKind], t).title,
    ).toEqual('2');
    expect(
      podRingLabel(mockDeploymentData, mockDeploymentData.kind, [mockPod as ExtPodKind], t)
        .subTitle,
    ).toEqual('Pods');
  });

  it('should return title scaled to 0, empty subtitle for podRingLabel when no pods exist', () => {
    const mockDeploymentData = _.set(_.cloneDeep(deployment), 'spec.replicas', 0);
    expect(
      podRingLabel(mockDeploymentData, mockDeploymentData.kind, [mockPod as ExtPodKind], t).title,
    ).toEqual('Scaled to 0');
    expect(
      podRingLabel(mockDeploymentData, mockDeploymentData.kind, [mockPod as ExtPodKind], t)
        .subTitle,
    ).toEqual('');
  });

  it('should return title 0, subtitle scaling to 2 and titleComponent for podRingLabel when scaling from 1 to 2 pods', () => {
    const deploymentWithReplicas = _.set(_.cloneDeep(deployment), 'spec.replicas', 2);
    const mockDeploymentData = _.set(deploymentWithReplicas, 'status.readyReplicas', 1);
    const podRingLabelData = podRingLabel(
      mockDeploymentData,
      mockDeploymentData.kind,
      [mockPod as ExtPodKind],
      t,
    );
    expect(podRingLabelData.title).toEqual('1');
    expect(podRingLabelData.subTitle).toEqual('Scaling to 2');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeTruthy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return title 0, subtitle scaling to 1 and titleComponent for podRingLabel when the first pod is being created', () => {
    const deploymentWithReplicas = _.set(_.cloneDeep(deployment), 'spec.replicas', 1);
    const mockDeploymentData = _.set(deploymentWithReplicas, 'status.readyReplicas', 0);
    const podRingLabelData = podRingLabel(
      mockDeploymentData,
      mockDeploymentData.kind,
      [mockPod as ExtPodKind],
      t,
    );

    expect(podRingLabelData.title).toEqual('0');
    expect(podRingLabelData.subTitle).toEqual('Scaling to 1');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeTruthy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return title 0, subtitle scaling to 1 and titleComponent for podRingLabel when pod count is 1 and status is pending', () => {
    const mockDeploymentData = _.set(_.cloneDeep(deployment), 'spec.replicas', 1);
    const mockPodData = _.set(_.cloneDeep(mockPod), 'status.phase', 'Pending');
    const podRingLabelData = podRingLabel(
      mockDeploymentData,
      mockDeploymentData.kind,
      [mockPodData as ExtPodKind],
      t,
    );
    expect(podRingLabelData.title).toEqual('0');
    expect(podRingLabelData.subTitle).toEqual('Scaling to 1');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeTruthy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return proper title, subtitle for podRingLabel for Daemon sets', () => {
    const mockDaemonData = _.cloneDeep(daemonSet);
    const podRingLabelData = podRingLabel(
      mockDaemonData,
      mockDaemonData.kind,
      [mockPod as ExtPodKind],
      t,
    );
    expect(podRingLabelData.title).toEqual('2');
    expect(podRingLabelData.subTitle).toEqual('Pods');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeFalsy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return proper title, subtitle for podRingLabel for Deployment Config', () => {
    const deploymentConfigWithReplicas = _.set(_.cloneDeep(deploymentConfig), 'spec.replicas', 2);
    const mockDeploymentConfigData = _.set(deploymentConfigWithReplicas, 'status.readyReplicas', 2);
    const podRingLabelData = podRingLabel(
      mockDeploymentConfigData,
      mockDeploymentConfigData.kind,
      [mockPod as ExtPodKind],
      t,
    );
    expect(podRingLabelData.title).toEqual('2');
    expect(podRingLabelData.subTitle).toEqual('Pods');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeFalsy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });

  it('should return proper title, subtitle for podRingLabel for Stateful sets', () => {
    const statefulSetWithReplicas = _.set(_.cloneDeep(statefulSets), 'spec.replicas', 2);
    const mockStatefulSetData = _.set(statefulSetWithReplicas, 'status.readyReplicas', 2);
    const podRingLabelData = podRingLabel(
      mockStatefulSetData,
      mockStatefulSetData.kind,
      [mockPod as ExtPodKind],
      t,
    );
    expect(podRingLabelData.title).toEqual('2');
    expect(podRingLabelData.subTitle).toEqual('Pods');
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
    const podRingLabelData = podRingLabel(
      mockDeploymentData,
      mockDeploymentData.kind,
      [mockFailedPod as ExtPodKind],
      t,
    );
    expect(podRingLabelData.title).toEqual('1');
    expect(podRingLabelData.subTitle).toEqual('Pod');
    expect(podRingLabelData.longTitle).toBeFalsy();
    expect(podRingLabelData.longSubtitle).toBeFalsy();
    expect(podRingLabelData.reversed).toBeFalsy();
  });
});

describe('usePodScalingAccessStatus', () => {
  let obj: K8sResourceKind;

  beforeEach(() => {
    checkPodEditAccessMock.mockImplementation(() =>
      Promise.resolve({ status: { allowed: false } }),
    );
    obj = {
      kind: '',
      metadata: {},
      spec: {},
      status: {},
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false for scaling when enableScaling is false', () => {
    obj.kind = 'Deployment';
    const { result } = renderHook(() =>
      usePodScalingAccessStatus(obj, DeploymentConfigModel, [], false),
    );
    expect(result.current).toBe(false);
  });

  it('should return false for knative revisions', () => {
    obj.kind = 'Revision';
    const { result } = renderHook(() => usePodScalingAccessStatus(obj, RevisionModel, [], true));
    expect(result.current).toBe(false);
  });

  it('should return false for pods', () => {
    obj.kind = 'Pod';
    const { result } = renderHook(() => usePodScalingAccessStatus(obj, PodModel, [], true));
    expect(result.current).toBe(false);
  });

  it('should return false when api call returns false for a resource', () => {
    obj.kind = 'DeploymentConfig';
    const { result } = renderHook(() =>
      usePodScalingAccessStatus(obj, DeploymentConfigModel, [], true),
    );
    expect(result.current).toBe(false);
  });

  it('should return false when API call results in an error', () => {
    checkPodEditAccessMock.mockImplementation(() => Promise.reject(new Error('error')));
    const { result } = renderHook(() =>
      usePodScalingAccessStatus(obj, DeploymentConfigModel, [], true),
    );
    expect(result.current).toBe(false);
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
