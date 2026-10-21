import { render, screen } from '@testing-library/react';
import type { K8sResourceKind } from '@console/internal/module/k8s/types';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import RoutesOverviewList from '../RoutesOverviewList';

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(() => true),
}));

jest.mock('@console/internal/components/utils', () => ({
  SidebarSectionHeading: 'SidebarSectionHeading',
}));

jest.mock('@patternfly/react-core', () => ({
  List: 'List',
}));

jest.mock('../KSRoutes', () => ({
  __esModule: true,
  default: 'KSRoutes',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../../utils/resource-overview-utils', () => ({
  getKnativeRoutesLinks: jest.fn(() => [{ url: 'test-url' }]),
  groupTrafficByRevision: jest.fn(() => ({ urls: [], percent: '0%' })),
}));

jest.mock('../RoutesOverviewListItem', () => ({
  __esModule: true,
  default: 'RoutesOverviewListItem',
}));

describe('RoutesOverviewList', () => {
  it('should show info if no Routes present', () => {
    render(<RoutesOverviewList ksroutes={[]} resource={MockKnativeResources.revisions.data[0]} />);
    expect(screen.getByText(/No Routes found for this resource/)).toBeInTheDocument();
  });

  it('should render RoutesOverviewListItem', () => {
    const { container } = render(
      <RoutesOverviewList
        ksroutes={MockKnativeResources.ksroutes.data}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(container.querySelector('list')).toBeInTheDocument();
    expect(container.querySelector('routesoverviewlistitem')).toBeInTheDocument();
  });

  it('should render multiple RoutesOverviewListItem when multiple routes', () => {
    const { container } = render(
      <RoutesOverviewList
        ksroutes={MockKnativeResources.ksroutes.data}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(container.querySelector('routesoverviewlistitem')).toBeInTheDocument();
  });

  it('should render with different route data', () => {
    const mockRouteData: K8sResourceKind = {
      ...MockKnativeResources.ksroutes.data[0],
      status: {
        ...MockKnativeResources.ksroutes.data[0].status,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            tag: 'tag1',
            url: 'http://tag1.test.com',
          },
        ],
      },
    };

    const { container } = render(
      <RoutesOverviewList
        ksroutes={[mockRouteData]}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(container.querySelector('routesoverviewlistitem')).toBeInTheDocument();
  });

  it('should handle complex route configurations', () => {
    const mockRouteData: K8sResourceKind = {
      ...MockKnativeResources.ksroutes.data[0],
      status: {
        ...MockKnativeResources.ksroutes.data[0].status,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            tag: 'tag1',
            url: 'http://tag1.test.com',
            percent: 20,
          },
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            tag: 'tag2',
            url: 'http://tag2.test.com',
            percent: 30,
          },
        ],
      },
    };

    const { container } = render(
      <RoutesOverviewList
        ksroutes={[mockRouteData]}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(container.querySelector('routesoverviewlistitem')).toBeInTheDocument();
  });
});
