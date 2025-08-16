import { render } from '@testing-library/react';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import { getKnativeRoutesLinks } from '../../../utils/resource-overview-utils';
import RoutesOverviewListItem from '../RoutesOverviewListItem';
import '@testing-library/jest-dom';

jest.mock('@patternfly/react-core', () => ({
  ListItem: 'ListItem',
  Grid: 'Grid',
  GridItem: 'GridItem',
}));

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
}));

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

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Variable to capture RoutesUrlLink props for testing
let mockCapturedRoutesUrlLinkProps: any[] = [];

jest.mock('../RoutesUrlLink', () => ({
  __esModule: true,
  default: (props: any) => {
    mockCapturedRoutesUrlLinkProps.push(props);
    return 'RoutesUrlLink';
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
    const { container } = render(<RoutesOverviewListItem routeLink={routeLink} />);
    expect(container.querySelector('ListItem')).toBeInTheDocument();
  });

  it('should have ResourceLink with proper kind', () => {
    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    const { container } = render(<RoutesOverviewListItem routeLink={routeLink} />);
    const resourceLink = container.querySelector('ResourceLink');
    expect(resourceLink).toBeInTheDocument();
    expect(resourceLink).toHaveAttribute('kind', 'RouteModel');
  });

  it('should have route ExternalLink with proper href', () => {
    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    render(<RoutesOverviewListItem routeLink={routeLink} />);

    // Check that the mock was called
    expect(mockCapturedRoutesUrlLinkProps).toHaveLength(1);
    expect(mockCapturedRoutesUrlLinkProps[0].urls).toEqual([
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    ]);
    expect(mockCapturedRoutesUrlLinkProps[0].title).toEqual('knative-plugin~Location');
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

    // Should render two RoutesUrlLink components (location + unique route)
    expect(mockCapturedRoutesUrlLinkProps).toHaveLength(2);
    expect(mockCapturedRoutesUrlLinkProps[0].title).toEqual('knative-plugin~Location');
    expect(mockCapturedRoutesUrlLinkProps[1].title).toEqual('knative-plugin~Unique Route');
  });

  it('should render with total percent', () => {
    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );

    const { container } = render(
      <RoutesOverviewListItem
        routeLink={routeLink}
        uniqueRoutes={['https://tag1.test.com', 'https://tag2.test.com']}
        totalPercent="50%"
      />,
    );

    // Should render two RoutesUrlLink components (location + unique route)
    expect(mockCapturedRoutesUrlLinkProps).toHaveLength(2);

    // Check percentage element
    const percentElement = container.querySelector('[data-test="route-percent"]');
    expect(percentElement).toBeInTheDocument();
    expect(percentElement).toHaveTextContent('50%');
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
    const { container } = render(<RoutesOverviewListItem routeLink={routeLink} />);

    expect(container.querySelector('ResourceLink')).toBeInTheDocument();
    expect(container.querySelector('routesurllink')).not.toBeInTheDocument();
    expect(container.querySelector('[data-test="route-percent"]')).not.toBeInTheDocument();
  });
});
