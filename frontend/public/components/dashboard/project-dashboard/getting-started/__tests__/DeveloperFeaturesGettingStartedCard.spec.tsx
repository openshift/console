import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  expectExternalLinkAttributes,
  cleanupServerFlag,
} from '../../../getting-started-test-utils';

import { DeveloperFeaturesGettingStartedCard } from '../DeveloperFeaturesGettingStartedCard';

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/version', () => ({
  useOpenShiftVersion: () => '4.8.0',
}));

jest.mock('@console/shared/src/hooks/flag', () => ({
  useFlag: jest.fn<boolean, []>(),
}));

const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const useFlagMock = useFlag as jest.Mock;

describe('DeveloperFeaturesGettingStartedCard', () => {
  beforeEach(() => {
    useActiveNamespaceMock.mockReset();
    useFlagMock.mockReset();

    // Default mock setup for most tests
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    useFlagMock.mockReturnValue(true);
  });

  afterEach(() => {
    cleanupServerFlag('addPage');
  });

  it('should contain links to current active namespace', async () => {
    renderWithProviders(<DeveloperFeaturesGettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Explore new developer features' })).toBeVisible();
    });

    const helmLink = screen.getByRole('link', { name: /Try the sample AI Chatbot Helm chart/ });
    expect(helmLink).toBeVisible();
    expect(helmLink).toHaveAttribute(
      'href',
      '/catalog/ns/active-namespace?catalogType=HelmChart&keyword=chatbot+AI+sample',
    );

    const topologyLink = screen.getByRole('link', {
      name: /Start building your application quickly in topology/,
    });
    expect(topologyLink).toBeVisible();
    expect(topologyLink).toHaveAttribute('href', '/topology/ns/active-namespace?catalogSearch=');

    const whatsNewLink = screen.getByRole('link', {
      name: "What's new in OpenShift 4.8 (Opens in new tab)",
    });
    expect(whatsNewLink).toBeVisible();
    expectExternalLinkAttributes(
      whatsNewLink,
      'https://developers.redhat.com/products/openshift/whats-new',
    );
  });

  it('should not show helm link when helm card is disabled', async () => {
    window.SERVER_FLAGS.addPage = '{ "disabledActions": "helm" }';

    renderWithProviders(<DeveloperFeaturesGettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Explore new developer features' })).toBeVisible();
    });

    expect(
      screen.queryByRole('link', { name: /Try the sample AI Chatbot Helm chart/ }),
    ).not.toBeInTheDocument();

    const topologyLink = screen.getByRole('link', {
      name: /Start building your application quickly in topology/,
    });
    expect(topologyLink).toBeVisible();
    expect(topologyLink).toHaveAttribute('href', '/topology/ns/active-namespace?catalogSearch=');

    const whatsNewLink = screen.getByRole('link', {
      name: "What's new in OpenShift 4.8 (Opens in new tab)",
    });
    expect(whatsNewLink).toBeVisible();
    expectExternalLinkAttributes(
      whatsNewLink,
      'https://developers.redhat.com/products/openshift/whats-new',
    );
  });

  it('should contain links without namespace if all namespaces are active', async () => {
    useActiveNamespaceMock.mockReturnValue([ALL_NAMESPACES_KEY]);

    renderWithProviders(<DeveloperFeaturesGettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Explore new developer features' })).toBeVisible();
    });

    const helmLink = screen.getByRole('link', { name: /Try the sample AI Chatbot Helm chart/ });
    expect(helmLink).toBeVisible();
    expect(helmLink).toHaveAttribute(
      'href',
      '/catalog/all-namespaces?catalogType=HelmChart&keyword=chatbot+AI+sample',
    );

    const topologyLink = screen.getByRole('link', {
      name: /Start building your application quickly in topology/,
    });
    expect(topologyLink).toBeVisible();
    expect(topologyLink).toHaveAttribute('href', '/topology/all-namespaces?catalogSearch=');

    const whatsNewLink = screen.getByRole('link', {
      name: "What's new in OpenShift 4.8 (Opens in new tab)",
    });
    expect(whatsNewLink).toBeVisible();
    expectExternalLinkAttributes(
      whatsNewLink,
      'https://developers.redhat.com/products/openshift/whats-new',
    );
  });

  it('should not show helm link when helm feature flag is disabled', async () => {
    useFlagMock.mockReturnValue(false);

    renderWithProviders(<DeveloperFeaturesGettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Explore new developer features' })).toBeVisible();
    });

    expect(
      screen.queryByRole('link', { name: /Try the sample AI Chatbot Helm chart/ }),
    ).not.toBeInTheDocument();

    const topologyLink = screen.getByRole('link', {
      name: /Start building your application quickly in topology/,
    });
    expect(topologyLink).toBeVisible();
    expect(topologyLink).toHaveAttribute('href', '/topology/ns/active-namespace?catalogSearch=');

    const whatsNewLink = screen.getByRole('link', {
      name: "What's new in OpenShift 4.8 (Opens in new tab)",
    });
    expect(whatsNewLink).toBeVisible();
    expectExternalLinkAttributes(
      whatsNewLink,
      'https://developers.redhat.com/products/openshift/whats-new',
    );
  });
});
