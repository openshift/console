import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ClusterNotUpgradeableAlert } from '../cluster-settings/cluster-settings-utils';
import { clusterVersionUpgradeableFalseProps } from './data/clusterVersionMock';

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

jest.mock('@console/shared/src/components/markdown/MarkdownView', () => ({
  MarkdownView: ({ content }: { content: string }) => <span>{content}</span>,
}));

jest.mock('../utils/resource-link', () => ({
  resourceListPathFromModel: jest.fn(() => '/k8s/all-namespaces/clusterserviceversions'),
  resourcePathFromModel: jest.fn(() => '/k8s/cluster/clusterautoscalers'),
  ResourceLink: jest.fn(() => null),
}));

const clusterVersionUpdatingProps = {
  ...clusterVersionUpgradeableFalseProps,
  status: {
    ...clusterVersionUpgradeableFalseProps.status,
    conditions: clusterVersionUpgradeableFalseProps.status.conditions.map((c) =>
      c.type === 'Upgradeable'
        ? {
            ...c,
            reason: 'ClusterVersionUpdating',
            message:
              'An update is already in progress and the details are in the Progressing condition.',
          }
        : c,
    ),
  },
};

describe('ClusterNotUpgradeableAlert', () => {
  it('does not render when Upgradeable is False because an update is already in progress', () => {
    const { container } = renderWithProviders(
      <ClusterNotUpgradeableAlert cv={clusterVersionUpdatingProps} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the alert body text from the ClusterVersion condition message', () => {
    renderWithProviders(<ClusterNotUpgradeableAlert cv={clusterVersionUpgradeableFalseProps} />);

    expect(
      screen.getByText(
        'Cluster operator testing cannot be upgraded between minor versions: The whatsits are broken.',
      ),
    ).toBeInTheDocument();
  });

  it('always renders the View ClusterOperators link', () => {
    renderWithProviders(<ClusterNotUpgradeableAlert cv={clusterVersionUpgradeableFalseProps} />);

    expect(screen.getByRole('link', { name: /View ClusterOperators/i })).toBeInTheDocument();
  });

  it('always renders the View installed Operators link with the correct all-namespaces URL', () => {
    renderWithProviders(<ClusterNotUpgradeableAlert cv={clusterVersionUpgradeableFalseProps} />);

    const link = screen.getByRole('link', { name: /View installed Operators/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/k8s/all-namespaces/clusterserviceversions');
  });
});
