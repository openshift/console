import { LongArrowAltRightIcon } from '@patternfly/react-icons/dist/esm/icons/long-arrow-alt-right-icon';
import { DeploymentConfigModel } from '@console/internal/models';
import type { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import * as usePodsWatcherModule from '../../../hooks/usePodsWatcher';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import type { PodRCData } from '../../../types';
import { samplePods } from '../../../utils/__tests__/test-resource-data';
import PodRing from '../PodRing';
import PodRingSet from '../PodRingSet';

jest.mock('../PodRing', () => ({
  default: jest.fn(() => null),
}));

jest.mock('@patternfly/react-icons/dist/esm/icons/long-arrow-alt-right-icon', () => ({
  LongArrowAltRightIcon: jest.fn(() => null),
}));

jest.mock('../../../hooks/usePodsWatcher', () => ({
  usePodsWatcher: jest.fn(),
}));

const mockPodRing = (PodRing as unknown) as jest.Mock;
const mockLongArrowAltRightIcon = (LongArrowAltRightIcon as unknown) as jest.Mock;

describe('PodRingSet', () => {
  const usePodsWatcherMock = usePodsWatcherModule.usePodsWatcher as jest.Mock;
  let podData: PodRCData;
  let obj: K8sResourceKind;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock data before each test for isolation.
    const rc = { pods: [], alerts: {}, revision: 0, obj: {}, phase: 'Complete' };
    podData = {
      current: { ...rc },
      previous: { ...rc },
      pods: [] as PodKind[],
      isRollingOut: false,
    };
    obj = { kind: DeploymentConfigModel.kind };
  });

  it('should render a single PodRing when not in a rolling deployment', () => {
    podData.pods = [samplePods.data[0] as PodKind];
    usePodsWatcherMock.mockReturnValue({ loaded: true, loadError: '', podData });

    renderWithProviders(<PodRingSet obj={obj} path="" />);

    // Assert that only one PodRing is rendered.
    expect(mockPodRing).toHaveBeenCalledTimes(1);
    expect(mockPodRing.mock.calls[0][0]).toMatchObject({ pods: [samplePods.data[0]] });
    expect(mockLongArrowAltRightIcon).not.toHaveBeenCalled();
  });

  it('should render two PodRings and an arrow during a rolling deployment', () => {
    podData.current = {
      pods: [samplePods.data[0] as PodKind],
      alerts: {},
      revision: 1,
      obj: {},
      phase: 'Pending',
    };
    podData.isRollingOut = true;
    const rollingObj = { ...obj, spec: { strategy: { type: 'Rolling' } } };
    usePodsWatcherMock.mockReturnValue({ loaded: true, loadError: '', podData });

    renderWithProviders(<PodRingSet obj={rollingObj} path="" />);

    // Assert that two PodRings are rendered.
    expect(mockPodRing).toHaveBeenCalledTimes(2);
    expect(mockLongArrowAltRightIcon).toHaveBeenCalledTimes(1);

    const { calls } = mockPodRing.mock;
    expect(calls[0][0]).toMatchObject({ pods: [] });
    expect(calls[1][0]).toMatchObject({ pods: [samplePods.data[0]] });
  });

  it('should render a single PodRing if there is a rolling strategy but no rollout is in progress', () => {
    usePodsWatcherMock.mockReturnValue({ loaded: true, loadError: '', podData });
    const rollingObj = { ...obj, spec: { strategy: { type: 'Rolling' } } };

    renderWithProviders(<PodRingSet obj={rollingObj} path="" />);

    expect(mockPodRing).toHaveBeenCalledTimes(1);
    expect(mockPodRing.mock.calls[0][0]).toMatchObject({ pods: [] });

    expect(mockLongArrowAltRightIcon).not.toHaveBeenCalled();
  });
});
