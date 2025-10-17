import { render } from '@testing-library/react';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import { getKnativeRoutesLinks } from '../../../utils/resource-overview-utils';
import KSRouteSplitListItem from '../KSRouteSplitListItem';

jest.mock('@patternfly/react-core', () => ({
  ListItem: 'ListItem',
  Grid: 'Grid',
  GridItem: 'GridItem',
}));

jest.mock('@console/shared/src/components/links/ExternalLink', () => ({
  ExternalLink: 'ExternalLink',
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
    const { container } = render(<KSRouteSplitListItem route={route} />);
    expect(container.querySelector('ListItem')).toBeInTheDocument();
  });

  it('should have route ExternalLink with proper href', () => {
    const route = getRouteData();
    const { container } = render(<KSRouteSplitListItem route={route} />);
    const externalLink = container.querySelector('ExternalLink');
    expect(externalLink).toBeInTheDocument();
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
    const { container } = render(<KSRouteSplitListItem route={route} />);
    expect(container.querySelector('ExternalLink')).not.toBeInTheDocument();
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
    const { container } = render(<KSRouteSplitListItem route={route} />);
    expect(container.querySelector('ExternalLink')).not.toBeInTheDocument();
  });
});
