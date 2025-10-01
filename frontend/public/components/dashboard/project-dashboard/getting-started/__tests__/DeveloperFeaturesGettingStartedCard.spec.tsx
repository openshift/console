import { screen, configure, act } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ALL_NAMESPACES_KEY, useActiveNamespace, useFlag } from '@console/shared/src';

import { DeveloperFeaturesGettingStartedCard } from '../DeveloperFeaturesGettingStartedCard';

jest.mock('@console/shared/src', () => ({
  ...jest.requireActual('@console/shared/src'),
  useActiveNamespace: jest.fn(),
  useOpenShiftVersion: () => '4.8.0',
  useFlag: jest.fn<boolean>(),
}));

// Workaround because getting-started exports also QuickStartGettingStartedCard
jest.mock(
  '@console/app/src/components/quick-starts/loader/QuickStartsLoader',
  () =>
    function QuickStartsLoaderMock({ children }) {
      return children;
    },
);

const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const useFlagMock = useFlag as jest.Mock;

describe('DeveloperFeaturesGettingStartedCard', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    useActiveNamespaceMock.mockReset();
    useFlagMock.mockReset();
  });

  afterEach(() => {
    delete window.SERVER_FLAGS.addPage;
  });

  it('should contain links to current active namespace', async () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    useFlagMock.mockReturnValue(true);

    await act(async () => {
      renderWithProviders(<DeveloperFeaturesGettingStartedCard />);
    });

    expect(screen.getByRole('heading', { name: 'Explore new developer features' })).toBeVisible();

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
    expect(whatsNewLink).toHaveAttribute(
      'href',
      'https://developers.redhat.com/products/openshift/whats-new',
    );
    expect(whatsNewLink).toHaveAttribute('target', '_blank');
    expect(whatsNewLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should not show helm link when helm card is disabled', async () => {
    window.SERVER_FLAGS.addPage = '{ "disabledActions": "helm" }';
    useFlagMock.mockReturnValue(true);
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);

    await act(async () => {
      renderWithProviders(<DeveloperFeaturesGettingStartedCard />);
    });

    expect(screen.getByRole('heading', { name: 'Explore new developer features' })).toBeVisible();

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
    expect(whatsNewLink).toHaveAttribute(
      'href',
      'https://developers.redhat.com/products/openshift/whats-new',
    );
    expect(whatsNewLink).toHaveAttribute('target', '_blank');
    expect(whatsNewLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should contain links without namespace if all namespaces are active', async () => {
    useActiveNamespaceMock.mockReturnValue([ALL_NAMESPACES_KEY]);
    useFlagMock.mockReturnValue(true);

    await act(async () => {
      renderWithProviders(<DeveloperFeaturesGettingStartedCard />);
    });

    expect(screen.getByRole('heading', { name: 'Explore new developer features' })).toBeVisible();

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
    expect(whatsNewLink).toHaveAttribute(
      'href',
      'https://developers.redhat.com/products/openshift/whats-new',
    );
    expect(whatsNewLink).toHaveAttribute('target', '_blank');
    expect(whatsNewLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should not show helm link when helm feature flag is disabled', async () => {
    useFlagMock.mockReturnValue(false);
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);

    await act(async () => {
      renderWithProviders(<DeveloperFeaturesGettingStartedCard />);
    });

    expect(screen.getByRole('heading', { name: 'Explore new developer features' })).toBeVisible();

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
    expect(whatsNewLink).toHaveAttribute(
      'href',
      'https://developers.redhat.com/products/openshift/whats-new',
    );
    expect(whatsNewLink).toHaveAttribute('target', '_blank');
    expect(whatsNewLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
