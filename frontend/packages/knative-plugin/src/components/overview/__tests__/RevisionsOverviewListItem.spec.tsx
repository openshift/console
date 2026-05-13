import { render, screen } from '@testing-library/react';
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
  ListItem: ({ children, ...rest }: any) => (
    <div data-test="mock-ListItem" {...rest}>
      {children}
    </div>
  ),
  Grid: ({ children, ...rest }: any) => (
    <div data-test="mock-Grid" {...rest}>
      {children}
    </div>
  ),
  GridItem: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
}));

jest.mock(
  '@console/internal/components/utils',
  () =>
    jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
      .knativeInternalUtilsStubs,
);

jest.mock('@console/shared', () => ({
  PodStatus: ({ title }: { title?: string }) => (
    <div data-test="mock-PodStatus" title={title}>
      {title}
    </div>
  ),
}));

jest.mock('../RoutesUrlLink', () => ({
  __esModule: true,
  default: () => <div data-test="mock-RoutesUrlLink" />,
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
    render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(screen.getByTestId('mock-ListItem')).toBeVisible();
  });

  it('should have ResourceLink with proper kind', () => {
    render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const resourceLink = screen.getByTestId('mock-ResourceLink');
    expect(resourceLink).toBeVisible();
    expect(resourceLink).toHaveAttribute('kind', 'RevisionModel');
  });

  it('should show traffic percent', () => {
    render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const trafficPercent = screen.getByTestId('revision-traffic-percent');
    expect(trafficPercent).toBeInTheDocument();
    expect(trafficPercent).toHaveTextContent('100%');
  });

  it('should not show deployments if not present', () => {
    render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(screen.queryByTestId('revision-deployment-list')).not.toBeInTheDocument();
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
    render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={mockServiceData}
      />,
    );
    expect(screen.getByTestId('mock-ResourceLink')).toBeVisible();
    const trafficPercent = screen.getByTestId('revision-traffic-percent');
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
      render(
        <RevisionsOverviewListItem
          revision={mockRevisionsDepData}
          service={MockKnativeResources.ksservices.data[0]}
        />,
      );
      expect(screen.getByTestId('revision-deployment-list')).toBeInTheDocument();
      const resourceLinks = screen.getAllByTestId('mock-ResourceLink');
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
      render(
        <RevisionsOverviewListItem
          revision={mockRevisionsDepData}
          service={MockKnativeResources.ksservices.data[0]}
        />,
      );
      const podStatus = screen.getByTestId('mock-PodStatus');
      expect(podStatus).toBeVisible();
      expect(podStatus).toHaveAttribute('title', '1');
    });
  });

  it('should not render RoutesUrlLink if status is not present', () => {
    const mockKsvc = {
      ...MockKnativeResources.ksservices.data[0],
    };
    delete mockKsvc.status;
    render(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={mockKsvc}
      />,
    );
    expect(screen.queryByTestId('mock-RoutesUrlLink')).not.toBeInTheDocument();
  });
});
