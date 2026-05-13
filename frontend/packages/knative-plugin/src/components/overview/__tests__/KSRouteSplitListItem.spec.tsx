import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import { getKnativeRoutesLinks } from '../../../utils/resource-overview-utils';
import KSRouteSplitListItem from '../KSRouteSplitListItem';

jest.mock('@patternfly/react-core', () => ({
  ListItem: ({ children }: { children?: ReactNode }) => (
    <div data-test="mock-ListItem">{children}</div>
  ),
  Grid: ({ children }: { children?: ReactNode }) => <div data-test="mock-Grid">{children}</div>,
  GridItem: ({ children }: { children?: ReactNode }) => (
    <div data-test="mock-GridItem">{children}</div>
  ),
}));

jest.mock('@console/shared/src/components/links/ExternalLink', () => ({
  ExternalLink: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a data-test="mock-ExternalLink" href={href}>
      {children}
    </a>
  ),
}));

describe('KSRouteSplitListItem', () => {
  const getRouteData = () => {
    const [route] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    return route;
  };

  it('should list the Route', () => {
    const route = getRouteData();
    render(<KSRouteSplitListItem route={route} />);
    expect(screen.getByTestId('mock-ListItem')).toBeVisible();
  });

  it('should have route ExternalLink with proper href', () => {
    const route = getRouteData();
    render(<KSRouteSplitListItem route={route} />);
    const externalLink = screen.getByTestId('mock-ExternalLink');
    expect(externalLink).toBeVisible();
    expect(externalLink).toHaveAttribute(
      'href',
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
  });

  it('should not render if url is not available', () => {
    const mockRouteData = {
      ...MockKnativeResources.ksroutes.data[0],
      status: {
        ...MockKnativeResources.ksroutes.data[0].status,
        url: undefined,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            percent: undefined,
            url: undefined,
          },
        ],
      },
    };
    const [route] = getKnativeRoutesLinks(mockRouteData, MockKnativeResources.revisions.data[0]);
    render(<KSRouteSplitListItem route={route} />);
    expect(screen.queryByTestId('mock-ExternalLink')).not.toBeInTheDocument();
  });

  it('should not render if percent is not available', () => {
    const mockRouteData = {
      ...MockKnativeResources.ksroutes.data[0],
      status: {
        ...MockKnativeResources.ksroutes.data[0].status,
        url: undefined,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            percent: undefined,
            url: undefined,
          },
        ],
      },
    };
    const [route] = getKnativeRoutesLinks(mockRouteData, MockKnativeResources.revisions.data[0]);
    render(<KSRouteSplitListItem route={route} />);
    expect(screen.queryByTestId('mock-ExternalLink')).not.toBeInTheDocument();
  });
});
