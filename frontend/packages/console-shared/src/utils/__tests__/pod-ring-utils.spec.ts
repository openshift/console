import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DeploymentConfigModel } from '@console/internal/models';
import { RevisionModel } from '@console/knative-plugin';
import * as utils from '../pod-utils';
import { usePodScalingAccessStatus, podRingLabel } from '../pod-ring-utils';
import { testHook } from '../../test-utils/hooks-utils';
import { mockPod } from '../__mocks__/pod-utils-test-data';
import { ExtPodKind } from '../../types';

describe('pod-ring utils:', () => {
  it('should return proper title, subtitle for podRingLabel', () => {
    const podWithReplicas = _.set(mockPod, 'spec.replicas', 2);
    const mockData = _.set(podWithReplicas, 'status.availableReplicas', 2);
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).title).toEqual(2);
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).subTitle).toEqual('pods');
  });

  it('should return title 0, subtitle scaling to 2 and no titleComponent, subtitleComponent for podRingLabel when scaling from 1 to 2 pods', () => {
    const podWithReplicas = _.set(_.cloneDeep(mockPod), 'spec.replicas', 2);
    const mockData = _.set(podWithReplicas, 'status.availableReplicas', 1);
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).title).toEqual(1);
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).subTitle).toEqual('scaling to 2');
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).titleComponent).toEqual(
      undefined,
    );
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).subTitleComponent).toEqual(
      undefined,
    );
  });

  it('should return title 0, subtitle scaling to 1 and no titleComponent, subtitleComponent for podRingLabel when the first pod is being created', () => {
    const podWithReplicas = _.set(mockPod, 'spec.replicas', 1);
    const mockData = _.set(podWithReplicas, 'status.availableReplicas', 0);
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).title).toEqual('0');
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).subTitle).toEqual('scaling to 1');
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).titleComponent).toEqual(
      undefined,
    );
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).subTitleComponent).toEqual(
      undefined,
    );
  });

  it('should return title 0, subtitle scaling to 1 and no titleComponent, subtitleComponent for podRingLabel when pod count is 1 and status is pending', () => {
    const podWithReplicas = _.set(_.cloneDeep(mockPod), 'spec.replicas', 1);
    const mockData = _.set(podWithReplicas, 'status.phase', 'Pending');
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).title).toEqual('0');
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).subTitle).toEqual('scaling to 1');
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).titleComponent).toEqual(
      undefined,
    );
    expect(podRingLabel(mockData, true, [mockData as ExtPodKind]).subTitleComponent).toEqual(
      undefined,
    );
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

  it('should return false for scaling when enableScaling is false', () => {
    obj.kind = 'Deployment';
    testHook(() => {
      expect(usePodScalingAccessStatus(obj, DeploymentConfigModel, [], false)).toBe(false);
    });
  });

  it('should return false for knative revisions', () => {
    obj.kind = 'Revision';
    testHook(() => {
      expect(usePodScalingAccessStatus(obj, RevisionModel, [], true)).toBe(false);
    });
  });

  it('should return false when api call returns false for a resource', () => {
    obj.kind = 'DeploymentConfig';
    testHook(() => {
      expect(usePodScalingAccessStatus(obj, DeploymentConfigModel, [], true)).toBe(false);
    });
  });

  it('should return false when API call results in an error', () => {
    jest
      .spyOn(utils, 'checkPodEditAccess')
      .mockImplementation(() => Promise.reject(new Error('error')));
    testHook(() => {
      expect(usePodScalingAccessStatus(obj, DeploymentConfigModel, [], true)).toBe(false);
    });
  });
});
