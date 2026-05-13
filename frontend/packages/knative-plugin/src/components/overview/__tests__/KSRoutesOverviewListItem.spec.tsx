import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../../../models';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import KSRoutesOverviewListItem from '../KSRoutesOverviewListItem';

jest.mock('@patternfly/react-core', () => ({
  ListItem: ({ children }: { children?: ReactNode }) => (
    <div data-test="mock-ListItem">{children}</div>
  ),
  Grid: ({ children }: { children?: ReactNode }) => <div data-test="mock-Grid">{children}</div>,
  GridItem: ({ children }: { children?: ReactNode }) => (
    <div data-test="mock-GridItem">{children}</div>
  ),
}));

jest.mock('@patternfly/react-core/dist/dynamic/components/ClipboardCopy', () => ({
  ClipboardCopy: 'ClipboardCopy',
}));

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .knativeInternalUtilsStubs.ResourceLink,
  ExternalLinkWithCopy: ({ href, text }: { href?: string; text?: string }) => (
    <a data-test="mock-ExternalLinkWithCopy" href={href ?? '#'}>
      {text}
    </a>
  ),
}));

jest.mock('react-i18next');

describe('KSRoutesOverviewListItem', () => {
  const [ksroute] = MockKnativeResources.ksroutes.data;

  it('should list the Route', () => {
    render(<KSRoutesOverviewListItem ksroute={ksroute} />);
    expect(screen.getByTestId('mock-ListItem')).toBeVisible();
  });

  it('should have ResourceLink with proper kind', () => {
    render(<KSRoutesOverviewListItem ksroute={ksroute} />);
    const resourceLink = screen.getByTestId('mock-ResourceLink');
    expect(resourceLink).toBeVisible();
    expect(resourceLink).toHaveAttribute('kind', referenceForModel(RouteModel));
  });

  it('should have route ExternalLink with proper href', () => {
    render(<KSRoutesOverviewListItem ksroute={ksroute} />);
    const externalLink = screen.getByTestId('mock-ExternalLinkWithCopy');
    expect(externalLink).toBeVisible();
    expect(externalLink).toHaveAttribute(
      'href',
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
    expect(externalLink).toHaveTextContent(
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
  });

  it('should not show the route url if it is not available', () => {
    const ksrouteNoUrl = { ...MockKnativeResources.ksroutes.data[0], status: { url: '' } };
    render(<KSRoutesOverviewListItem ksroute={ksrouteNoUrl} />);
    expect(screen.getByTestId('mock-ResourceLink')).toBeVisible();
    expect(screen.queryByTestId('mock-ExternalLinkWithCopy')).not.toBeInTheDocument();
  });

  it('should have ResourceLink with proper kind and not external link if status is not preset on route', () => {
    const ksrouteNoStatus = _.omit(MockKnativeResources.ksroutes.data[0], 'status');
    render(<KSRoutesOverviewListItem ksroute={ksrouteNoStatus} />);
    const resourceLink = screen.getByTestId('mock-ResourceLink');
    expect(resourceLink).toBeVisible();
    expect(resourceLink).toHaveAttribute('kind', referenceForModel(RouteModel));
    expect(screen.queryByTestId('mock-ExternalLinkWithCopy')).not.toBeInTheDocument();
  });
});
