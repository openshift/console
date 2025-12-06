import * as React from 'react';
import { screen } from '@testing-library/react';
import * as rbacModule from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { mockHelmReleases } from '../../../__tests__/helm-release-mock-data';
import HelmReleaseOverview from '../HelmReleaseOverview';

jest.mock('@console/dynamic-plugin-sdk/src/app/components/utils/rbac', () => {
  const actual = jest.requireActual('@console/dynamic-plugin-sdk/src/app/components/utils/rbac');
  return {
    ...actual,
    useAccessReview: jest.fn(),
  };
});

const spyUseAccessReview = rbacModule.useAccessReview as jest.Mock;

const helmReleaseOverviewProps: React.ComponentProps<typeof HelmReleaseOverview> = {
  obj: {
    kind: 'Secret',
    apiVersion: 'v1',
    metadata: {
      name: 'secret-name',
      namespace: 'xyz',
      creationTimestamp: '2020-01-13T05:42:19Z',
      labels: {
        name: 'ghost-test',
        owner: 'helm',
        status: 'deployed',
      },
    },
  },
  customData: mockHelmReleases[0],
};

describe('HelmReleaseOverview', () => {
  it('should render the Section Heading for the Overview page', () => {
    spyUseAccessReview.mockReturnValue([true]);
    renderWithProviders(<HelmReleaseOverview {...helmReleaseOverviewProps} />);
    expect(screen.getByText('Helm Release details')).toBeTruthy();
  });

  it('should render the ResourceSummary component', () => {
    spyUseAccessReview.mockReturnValue([true]);
    renderWithProviders(<HelmReleaseOverview {...helmReleaseOverviewProps} />);
    expect(document.querySelector('[data-test-id="resource-summary"]')).toBeTruthy();
  });

  it('should render the HelmChartSummary component', () => {
    spyUseAccessReview.mockReturnValue([true]);
    renderWithProviders(<HelmReleaseOverview {...helmReleaseOverviewProps} />);
    // HelmChartSummary typically renders chart information
    expect(screen.getByText('Chart version')).toBeTruthy();
    expect(screen.getByText('App version')).toBeTruthy();
  });
});
