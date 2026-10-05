import { isDataViewTdObject } from '@patternfly/react-data-view/dist/esm/DataViewTable/DataViewTable';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SubscriptionKind } from '../../types';
import { getOperatorMigrationScans } from '../../utils/operator-migration-api';
import type { OperatorMigrationScan } from '../../utils/operator-migration-api';
import { getOperatorMigrationEligibilityCell } from '../operator-migration-eligibility';

jest.mock('react-i18next', () => {
  const t = (key: string, values?: Record<string, string>) =>
    key.replace(/{{(\w+)}}/g, (_, name: string) => values?.[name] ?? '');
  return { useTranslation: () => ({ t }) };
});

jest.mock('../../status/csv-status', () => ({ subscriptionForCSV: jest.fn() }));
jest.mock('../../utils/operator-migration-api', () => ({
  getOperatorMigrationScans: jest.fn(),
  OPERATOR_MIGRATION_SCAN_INVALIDATED_EVENT: 'test-migration-scans',
}));

const subscription: SubscriptionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
  metadata: { name: 'netobserv-operator', namespace: 'netobserv-operator' },
  spec: { name: 'netobserv-operator', source: 'redhat-operators' },
};

const renderCell = () => {
  const [cell] = getOperatorMigrationEligibilityCell([
    { obj: subscription, rowData: { subscriptions: [] }, activeColumnIDs: new Set(), index: 0 },
  ]);
  render(<>{isDataViewTdObject(cell) ? cell.cell : cell}</>);
};

const mockScan = (scan: Partial<OperatorMigrationScan>) => {
  (getOperatorMigrationScans as jest.Mock).mockResolvedValue([
    {
      subscriptionName: subscription.metadata.name,
      subscriptionNamespace: subscription.metadata.namespace,
      reason: '',
      eligible: false,
      ...scan,
    },
  ]);
};

describe('OperatorMigrationEligibilityCell', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    {
      status: 'Eligible',
      eligible: true,
      label: 'Eligible',
      message: 'This operator can be migrated to Next-Gen Operators.',
    },
    {
      status: 'AlreadyMigrated',
      label: 'Already migrated',
      message: 'This operator is already managed by Next-Gen Operators.',
    },
    {
      status: 'Conflict',
      label: 'Conflict',
      message: 'Subscription and ClusterExtension both exist.',
      reason: 'Subscription and ClusterExtension both exist.',
    },
  ])(
    'opens details for $status operators',
    async ({ status, eligible, label, message, reason }) => {
      mockScan({ status, eligible, reason });
      renderCell();
      const user = userEvent.setup();

      await user.click(await screen.findByRole('button', { name: `Migration status: ${label}` }));

      expect(await screen.findByText(message)).toBeVisible();
    },
  );

  it('lets keyboard users inspect failed checks', async () => {
    mockScan({
      status: 'Ineligible',
      reason: 'Catalog unavailable.',
      failedChecks: [
        { name: 'Catalog availability', passed: false, message: 'Create a ClusterCatalog.' },
      ],
    });
    renderCell();
    const user = userEvent.setup();
    expect(
      await screen.findByRole('button', { name: 'Migration status: Not eligible' }),
    ).toBeVisible();

    await user.tab();
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Catalog unavailable.')).toBeVisible();
    expect(screen.getByText('Create a ClusterCatalog.')).toBeVisible();
  });

  it('shows that the scan is unavailable when the request fails', async () => {
    (getOperatorMigrationScans as jest.Mock).mockRejectedValue(new Error('Access denied.'));
    renderCell();

    expect(await screen.findByText('Scan unavailable')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows when no scan is available for an operator', async () => {
    (getOperatorMigrationScans as jest.Mock).mockResolvedValue([]);
    renderCell();

    expect(await screen.findByText('Not scanned')).toBeVisible();
  });
});
