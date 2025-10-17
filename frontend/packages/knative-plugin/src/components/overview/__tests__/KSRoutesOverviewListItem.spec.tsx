import { render } from '@testing-library/react';
import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../../../models';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import KSRoutesOverviewListItem from '../KSRoutesOverviewListItem';

jest.mock('@patternfly/react-core', () => ({
  ListItem: 'ListItem',
  Grid: 'Grid',
  GridItem: 'GridItem',
}));

jest.mock('@patternfly/react-core/dist/dynamic/components/ClipboardCopy', () => ({
  ClipboardCopy: 'ClipboardCopy',
}));

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
  ExternalLinkWithCopy: 'ExternalLinkWithCopy',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('KSRoutesOverviewListItem', () => {
  const [ksroute] = MockKnativeResources.ksroutes.data;

  it('should list the Route', () => {
    const { container } = render(<KSRoutesOverviewListItem ksroute={ksroute} />);
    expect(container.querySelector('ListItem')).toBeInTheDocument();
  });

  it('should have ResourceLink with proper kind', () => {
    const { container } = render(<KSRoutesOverviewListItem ksroute={ksroute} />);
    const resourceLink = container.querySelector('ResourceLink');
    expect(resourceLink).toBeInTheDocument();
    expect(resourceLink).toHaveAttribute('kind', referenceForModel(RouteModel));
  });

  it('should have route ExternalLink with proper href', () => {
    const { container } = render(<KSRoutesOverviewListItem ksroute={ksroute} />);
    const externalLink = container.querySelector('ExternalLinkWithCopy');
    expect(externalLink).toBeInTheDocument();
    expect(externalLink).toHaveAttribute(
      'href',
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
    expect(externalLink).toHaveAttribute(
      'text',
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
  });

  it('should not show the route url if it is not available', () => {
    const ksrouteNoUrl = { ...MockKnativeResources.ksroutes.data[0], status: { url: '' } };
    const { container } = render(<KSRoutesOverviewListItem ksroute={ksrouteNoUrl} />);
    expect(container.querySelector('ResourceLink')).toBeInTheDocument();
    expect(container.querySelector('ExternalLinkWithCopy')).not.toBeInTheDocument();
  });

  it('should have ResourceLink with proper kind and not external link if status is not preset on route', () => {
    const ksrouteNoStatus = _.omit(MockKnativeResources.ksroutes.data[0], 'status');
    const { container } = render(<KSRoutesOverviewListItem ksroute={ksrouteNoStatus} />);
    const resourceLink = container.querySelector('ResourceLink');
    expect(resourceLink).toBeInTheDocument();
    expect(resourceLink).toHaveAttribute('kind', referenceForModel(RouteModel));
    expect(container.querySelector('ExternalLinkWithCopy')).not.toBeInTheDocument();
  });
});
