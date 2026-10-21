import { render } from '@testing-library/react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import RevisionsOverviewListItem from '../RevisionsOverviewListItem';

jest.mock('victory', () => ({
  createContainer: jest.fn(() => jest.fn()),
  VictoryContainer: 'VictoryContainer',
  VictoryChart: 'VictoryChart',
  VictoryArea: 'VictoryArea',
  VictoryAxis: 'VictoryAxis',
  VictoryLine: 'VictoryLine',
  VictoryLabel: 'VictoryLabel',
  VictoryScatter: 'VictoryScatter',
  VictoryBar: 'VictoryBar',
  VictoryPie: 'VictoryPie',
  VictoryTooltip: 'VictoryTooltip',
  VictoryTheme: {
    material: {},
    grayscale: {},
  },
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceForModel: jest.fn(() => 'RevisionModel'),
  K8sResourceConditionStatus: {
    True: 'True',
    False: 'False',
    Unknown: 'Unknown',
  },
}));

jest.mock('@patternfly/react-charts/victory', () => ({
  ChartLabel: 'ChartLabel',
}));

jest.mock('@patternfly/react-core', () => ({
  ListItem: 'ListItem',
  Grid: 'Grid',
  GridItem: 'GridItem',
}));

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
}));

jest.mock('@console/shared', () => ({
  PodStatus: 'PodStatus',
}));

jest.mock('../RoutesUrlLink', () => ({
  __esModule: true,
  default: 'RoutesUrlLink',
}));

jest.mock('../../../utils/usePodsForRevisions', () => ({
  usePodsForRevisions: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('RevisionsOverviewListItem', () => {
  const mockUseK8sWatchResource = useK8sWatchResource as any;
  const mockUsePodsForRevisions = usePodsForRevisions as any;

  beforeEach(() => {
    mockUseK8sWatchResource.mockReturnValue([[MockKnativeResources.ksservices.data[0]], true]);
    mockUsePodsForRevisions.mockReturnValue({
      loaded: true,
      loadError: null,
      pods: {},
    });
  });

  it('should list the Revision', () => {
    const { container } = render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(container.querySelector('ListItem')).toBeInTheDocument();
  });

  it('should have ResourceLink with proper kind', () => {
    const { container } = render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const resourceLink = container.querySelector('ResourceLink');
    expect(resourceLink).toBeInTheDocument();
    expect(resourceLink).toHaveAttribute('kind', 'RevisionModel');
  });

  it('should show traffic percent', () => {
    const { container } = render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const trafficPercent = container.querySelector('[data-test="revision-traffic-percent"]');
    expect(trafficPercent).toBeInTheDocument();
    expect(trafficPercent).toHaveTextContent('100%');
  });

  it('should not show deployments if not present', () => {
    const { container } = render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(container.querySelector('.odc-revision-deployment-list')).not.toBeInTheDocument();
  });

  it('should sum the traffic percentage for the same revision', () => {
    const { revisionName } = MockKnativeResources.ksservices.data[0].status.traffic[0];
    const mockServiceData = {
      ...MockKnativeResources.ksservices.data[0],
      status: {
        ...MockKnativeResources.ksservices.data[0].status,
        traffic: [
          { percent: 50, tag: 'tag-1', revisionName },
          { percent: 50, tag: 'tag-2', revisionName },
        ],
      },
    };
    const { container } = render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={mockServiceData}
      />,
    );
    expect(container.querySelector('ResourceLink')).toBeInTheDocument();
    const trafficPercent = container.querySelector('[data-test="revision-traffic-percent"]');
    expect(trafficPercent).toHaveTextContent('100%');
  });

  describe('RevisionsOverviewListItem: deployments', () => {
    beforeEach(() => {
      mockUsePodsForRevisions.mockReturnValue({
        loaded: true,
        loadError: null,
        pods: [
          {
            obj: {
              metadata: {
                ownerReferences: [
                  {
                    apiVersion: 'apps/v1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'Deployment',
                    name: 'event-greeter-v1-deployment',
                    uid: 'd0387ddc-51e8-437d-a100-a001be806d45',
                  },
                ],
              },
              status: { availableReplicas: 1 },
            },
          },
        ],
      });
    });

    it('should show ResourceLink for deployment', () => {
      const resources = {
        current: {
          obj: {
            metadata: {
              ownerReferences: [
                {
                  apiVersion: 'apps/v1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Deployment',
                  name: 'event-greeter-v1-deployment',
                  uid: 'd0387ddc-51e8-437d-a100-a001be806d45',
                },
              ],
            },
            status: { availableReplicas: 1 },
          },
        },
      };
      const mockRevisionsDepData = { ...MockKnativeResources.revisions.data[0], resources };
      const { container } = render(
        <RevisionsOverviewListItem
          revision={mockRevisionsDepData}
          service={MockKnativeResources.ksservices.data[0]}
        />,
      );
      expect(container.querySelector('.odc-revision-deployment-list')).toBeInTheDocument();
      const resourceLinks = container.querySelectorAll('ResourceLink');
      expect(resourceLinks).toHaveLength(2);
      expect(resourceLinks[1]).toHaveAttribute('kind', 'Deployment');
    });

    it('should show pods for deployment', () => {
      const resources = {
        current: {
          obj: {
            metadata: {
              ownerReferences: [
                {
                  apiVersion: 'apps/v1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Deployment',
                  name: 'event-greeter-v1-deployment',
                  uid: 'd0387ddc-51e8-437d-a100-a001be806d45',
                },
              ],
            },
            status: { availableReplicas: 1 },
          },
        },
      };
      const mockRevisionsDepData = { ...MockKnativeResources.revisions.data[0], resources };
      const { container } = render(
        <RevisionsOverviewListItem
          revision={mockRevisionsDepData}
          service={MockKnativeResources.ksservices.data[0]}
        />,
      );
      const podStatus = container.querySelector('PodStatus');
      expect(podStatus).toBeInTheDocument();
      expect(podStatus).toHaveAttribute('title', '1');
    });
  });

  it('should not render RoutesUrlLink if status is not present', () => {
    const mockKsvc = {
      ...MockKnativeResources.ksservices.data[0],
    };
    delete mockKsvc.status;
    const { container } = render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={mockKsvc}
      />,
    );
    expect(container.querySelector('RoutesUrlLink')).not.toBeInTheDocument();
  });
});
