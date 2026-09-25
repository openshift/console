import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ClusterNotUpgradeableAlert } from '../cluster-settings';
import { ClusterVersionKind, K8sResourceConditionStatus } from '../../../module/k8s';

jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const text = key.replace('public~', '');
      if (opts) {
        return Object.entries(opts).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
          text,
        );
      }
      return text;
    },
  }),
}));

jest.mock('@console/internal/components/markdown-view', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    SyncMarkdownView: ({ content }: { content: string }) =>
      React.createElement('span', null, content),
  };
});

jest.mock('../../utils/resource-link', () => ({
  resourceListPathFromModel: jest.fn(() => '/k8s/all-namespaces/clusterserviceversions'),
  resourcePathFromModel: jest.fn(() => '/k8s/cluster/clusterautoscalers'),
  ResourceLink: jest.fn(() => null),
}));

const clusterVersionUpgradeableFalse: ClusterVersionKind = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: { name: 'version', resourceVersion: '1', uid: 'test-uid' },
  spec: { channel: 'stable-4.22', clusterID: 'test-id' },
  status: {
    availableUpdates: [],
    observedGeneration: 1,
    versionHash: 'test-hash',
    conditions: [
      {
        type: 'Upgradeable',
        status: K8sResourceConditionStatus.False,
        reason: 'Test',
        message:
          'Cluster operator testing cannot be upgraded between minor versions: The whatsits are broken.',
        lastTransitionTime: '2026-01-01T00:00:00Z',
      },
    ],
    desired: { version: '4.22.0', image: 'test-image' },
    history: [
      {
        version: '4.22.0',
        image: 'test-image',
        state: 'Completed',
        verified: true,
        startedTime: '2026-01-01T00:00:00Z',
        completionTime: '2026-01-01T01:00:00Z',
      },
    ],
  },
};

describe('ClusterNotUpgradeableAlert', () => {
  it('renders the alert body text from the ClusterVersion condition message', () => {
    renderWithProviders(<ClusterNotUpgradeableAlert cv={clusterVersionUpgradeableFalse} />);

    expect(
      screen.getByText(
        'Cluster operator testing cannot be upgraded between minor versions: The whatsits are broken.',
      ),
    ).toBeInTheDocument();
  });

  it('always renders the View ClusterOperators link', () => {
    renderWithProviders(<ClusterNotUpgradeableAlert cv={clusterVersionUpgradeableFalse} />);

    expect(screen.getByRole('link', { name: /View ClusterOperators/i })).toBeInTheDocument();
  });

  it('always renders the View installed Operators link with the correct all-namespaces URL', () => {
    renderWithProviders(<ClusterNotUpgradeableAlert cv={clusterVersionUpgradeableFalse} />);

    const link = screen.getByRole('link', { name: /View installed Operators/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/k8s/all-namespaces/clusterserviceversions');
  });
});
