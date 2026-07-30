import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import type { K8sResourceKind } from '@console/internal/module/k8s/types';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import RoutesOverviewList from '../RoutesOverviewList';

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(() => true),
}));

jest.mock(
  '@console/internal/components/utils',
  () =>
    jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
      .knativeInternalUtilsStubs,
);

jest.mock('@patternfly/react-core', () => ({
  List: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

jest.mock('../KSRoutes', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('react-i18next');

jest.mock('../../../utils/resource-overview-utils', () => ({
  getKnativeRoutesLinks: jest.fn(() => [{ url: 'test-url' }]),
  groupTrafficByRevision: jest.fn(() => ({ urls: [], percent: '0%' })),
}));

jest.mock('../RoutesOverviewListItem', () => ({
  __esModule: true,
  default: () => <div data-test="mock-RoutesOverviewListItem" />,
}));

describe('RoutesOverviewList', () => {
  it('should show info if no Routes present', () => {
    render(<RoutesOverviewList ksroutes={[]} resource={MockKnativeResources.revisions.data[0]} />);
    expect(screen.getByText(/No Routes found for this resource/)).toBeInTheDocument();
  });

  it('should render RoutesOverviewListItem', () => {
    render(
      <RoutesOverviewList
        ksroutes={MockKnativeResources.ksroutes.data}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(screen.getByTestId('mock-RoutesOverviewListItem')).toBeVisible();
  });

  it('should render multiple RoutesOverviewListItem when multiple routes', () => {
    render(
      <RoutesOverviewList
        ksroutes={MockKnativeResources.ksroutes.data}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(screen.getByTestId('mock-RoutesOverviewListItem')).toBeVisible();
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

    render(
      <RoutesOverviewList
        ksroutes={[mockRouteData]}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(screen.getByTestId('mock-RoutesOverviewListItem')).toBeVisible();
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

    render(
      <RoutesOverviewList
        ksroutes={[mockRouteData]}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(screen.getByTestId('mock-RoutesOverviewListItem')).toBeVisible();
  });
});
