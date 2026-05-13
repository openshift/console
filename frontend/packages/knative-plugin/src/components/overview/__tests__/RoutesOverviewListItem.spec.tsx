import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import { getKnativeRoutesLinks } from '../../../utils/resource-overview-utils';
import RoutesOverviewListItem from '../RoutesOverviewListItem';

jest.mock('@patternfly/react-core', () => ({
  ListItem: ({ children }: { children?: ReactNode }) => (
    <div data-test="mock-ListItem">{children}</div>
  ),
  Grid: ({ children }: { children?: ReactNode }) => <div data-test="mock-Grid">{children}</div>,
  GridItem: ({ children }: { children?: ReactNode }) => (
    <div data-test="mock-GridItem">{children}</div>
  ),
}));

jest.mock(
  '@console/internal/components/utils',
  () =>
    jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
      .knativeInternalUtilsStubs,
);

jest.mock('@console/internal/module/k8s', () => ({
  referenceForModel: jest.fn(() => 'RouteModel'),
  referenceFor: jest.fn(() => 'TestReference'),
  K8sResourceConditionStatus: {
    True: 'True',
    False: 'False',
    Unknown: 'Unknown',
  },
}));

jest.mock('../../../utils/resource-overview-utils', () => ({
  getKnativeRoutesLinks: jest.fn(),
}));

jest.mock('react-i18next');

let mockCapturedRoutesUrlLinkProps: any[] = [];

jest.mock('../RoutesUrlLink', () => ({
  __esModule: true,
  default: (props: any) => {
    mockCapturedRoutesUrlLinkProps.push(props);
    return <div data-test="mock-RoutesUrlLink" />;
  },
}));

describe('RoutesOverviewListItem', () => {
  const mockGetKnativeRoutesLinks = getKnativeRoutesLinks as any;

  beforeEach(() => {
    mockCapturedRoutesUrlLinkProps = [];
    mockGetKnativeRoutesLinks.mockReturnValue([
      {
        url: 'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
        name: 'overlayimage',
        namespace: 'knativeapps',
        percent: '100%',
      },
    ]);
  });

  it('should list the Route', () => {
    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    render(<RoutesOverviewListItem routeLink={routeLink} />);
    expect(screen.getByTestId('mock-ListItem')).toBeVisible();
  });

  it('should have ResourceLink with proper kind', () => {
    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    render(<RoutesOverviewListItem routeLink={routeLink} />);
    const resourceLink = screen.getByTestId('mock-ResourceLink');
    expect(resourceLink).toBeVisible();
    expect(resourceLink).toHaveAttribute('kind', 'RouteModel');
  });

  it('should have route ExternalLink with proper href', () => {
    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    render(<RoutesOverviewListItem routeLink={routeLink} />);

    expect(mockCapturedRoutesUrlLinkProps).toHaveLength(1);
    expect(mockCapturedRoutesUrlLinkProps[0].urls).toEqual([
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    ]);
    expect(mockCapturedRoutesUrlLinkProps[0].title).toEqual('Location');
  });

  it('should render with unique routes', () => {
    mockGetKnativeRoutesLinks.mockReturnValue([
      {
        url: 'http://abc-overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
        name: 'overlayimage',
        namespace: 'knativeapps',
        percent: '100%',
      },
    ]);

    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );

    render(
      <RoutesOverviewListItem
        routeLink={routeLink}
        uniqueRoutes={[
          'http://abc-overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
        ]}
      />,
    );

    expect(mockCapturedRoutesUrlLinkProps).toHaveLength(2);
    expect(mockCapturedRoutesUrlLinkProps[0].title).toEqual('Location');
    expect(mockCapturedRoutesUrlLinkProps[1].title).toEqual('Unique Route');
  });

  it('should render with total percent', () => {
    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );

    render(
      <RoutesOverviewListItem
        routeLink={routeLink}
        uniqueRoutes={['https://tag1.test.com', 'https://tag2.test.com']}
        totalPercent="50%"
      />,
    );

    expect(mockCapturedRoutesUrlLinkProps).toHaveLength(2);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should not show route url when no data available', () => {
    mockGetKnativeRoutesLinks.mockReturnValue([
      {
        url: '',
        name: 'overlayimage',
        namespace: 'knativeapps',
        percent: '',
      },
    ]);

    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    render(<RoutesOverviewListItem routeLink={routeLink} />);

    expect(screen.getByTestId('mock-ResourceLink')).toBeVisible();
    expect(screen.queryByTestId('mock-RoutesUrlLink')).not.toBeInTheDocument();
    expect(screen.queryByTestId('route-percent')).not.toBeInTheDocument();
  });
});
