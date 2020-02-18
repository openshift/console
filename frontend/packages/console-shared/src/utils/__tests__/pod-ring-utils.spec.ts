import * as _ from 'lodash';
import { mockPod } from '../__mocks__/pod-utils-test-data';
import { podRingLabel } from '../pod-ring-utils';
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
