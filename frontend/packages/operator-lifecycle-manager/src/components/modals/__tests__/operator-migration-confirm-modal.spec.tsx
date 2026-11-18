import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InternalToastProvider } from '@console/app/src/providers/toast/InternalToastProvider';
import { OverlayProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import {
  dryRunOperatorMigration,
  getOperatorMigrationJob,
  getOperatorMigrationJobs,
  startOperatorMigration,
} from '../../../utils/operator-migration-api';
import type {
  OperatorMigrationAcknowledgements,
  OperatorMigrationDryRunResponse,
  OperatorMigrationRequest,
} from '../../../utils/operator-migration-api';
import {
  OperatorMigrationNotificationsProvider,
  useOperatorMigrationNotifications,
  useMigrationNotifications,
} from '../../operator-migration-notifications';
import { OperatorMigrationConfirmModalOverlay } from '../operator-migration-confirm-modal';

jest.mock('react-i18next');

jest.mock('../../../utils/operator-migration-api', () => ({
  dryRunOperatorMigration: jest.fn(),
  getOperatorMigrationJob: jest.fn(),
  getOperatorMigrationJobs: jest.fn(),
  invalidateOperatorMigrationScans: jest.fn(),
  startOperatorMigration: jest.fn(),
}));

const Notifications = ({ children }: { children: ReactNode }) => {
  const value = useOperatorMigrationNotifications();
  return (
    <OperatorMigrationNotificationsProvider value={value}>
      {children}
    </OperatorMigrationNotificationsProvider>
  );
};

const makeOperator = (
  subscriptionName: string,
): OperatorMigrationRequest & { displayName: string } => ({
  subscriptionName,
  subscriptionNamespace: 'operators',
  displayName: `${subscriptionName} display name`,
});

const makeDryRun = (
  request: OperatorMigrationRequest,
  eligible = true,
): OperatorMigrationDryRunResponse => ({
  operator: {
    ...request,
    status: eligible ? 'Eligible' : 'Ineligible',
    eligible,
    reason: eligible ? '' : 'A hard migration check failed.',
    failedChecks: eligible
      ? []
      : [{ name: 'No APIService definitions', passed: false, message: 'Not supported.' }],
  },
  eligible,
  plan: eligible
    ? {
        clusterExtensionName: request.subscriptionName,
        installNamespace: request.subscriptionNamespace,
        packageName: request.subscriptionName,
        version: '1.0.0',
        channel: 'stable',
        clusterCatalog: 'redhat-operators',
        clusterObjectSetName: `${request.subscriptionName}-1`,
        resources: [{ kind: 'Deployment', count: 1 }],
        actions: ['Create ClusterExtension'],
      }
    : undefined,
});

const ModalLauncher = ({
  operators,
  isBulk,
}: {
  operators: (OperatorMigrationRequest & { displayName: string })[];
  isBulk: boolean;
}) => {
  const { monitorMigration } = useMigrationNotifications();
  const launchOverlay = useOverlay();
  useEffect(() => {
    launchOverlay(OperatorMigrationConfirmModalOverlay, { operators, isBulk, monitorMigration });
  }, [isBulk, launchOverlay, monitorMigration, operators]);
  return null;
};

const renderModal = (
  operators: (OperatorMigrationRequest & { displayName: string })[],
  isBulk: boolean,
) =>
  render(
    <InternalToastProvider>
      <OverlayProvider>
        <Notifications>
          <ModalLauncher operators={operators} isBulk={isBulk} />
        </Notifications>
      </OverlayProvider>
    </InternalToastProvider>,
  );

const openReview = async (user: ReturnType<typeof userEvent.setup>) => {
  const acknowledgement = screen.getByRole('checkbox', {
    name: 'I reviewed the migration plan.',
  });
  await waitFor(() => expect(acknowledgement).toBeEnabled());
  await user.click(acknowledgement);
  const review = screen.getByRole('button', { name: 'Review migration' });
  await waitFor(() => expect(review).toBeEnabled());
  await user.click(review);
};

const confirmReview = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    screen.getByRole('checkbox', {
      name: 'I understand that a failed migration might require manual recovery.',
    }),
  );
  await user.click(
    screen.getByRole('checkbox', {
      name: 'I have a backup or recovery plan for the affected resources.',
    }),
  );
};

describe('OperatorMigrationConfirmModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([]);
    (dryRunOperatorMigration as jest.Mock).mockImplementation((request: OperatorMigrationRequest) =>
      Promise.resolve(makeDryRun(request)),
    );
  });

  it('checks migration before review and lets users inspect the resource plan', async () => {
    renderModal([makeOperator('operator-one')], false);
    const user = userEvent.setup();

    expect(
      screen.getByRole('dialog', {
        name: 'Migrate Classic Operators to cluster extensions',
      }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeDisabled();
    expect(await screen.findByText('Passed')).toBeVisible();
    expect(screen.getByRole('cell', { name: '1.0.0' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'redhat-operators' })).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Migration plan for operator-one display name' }),
    );
    const resources = screen.getByRole('table', {
      name: 'Resources to migrate for operator-one display name',
    });
    expect(within(resources).getByRole('row', { name: 'Deployment 1' })).toBeVisible();
    expect(screen.getByText('Create ClusterExtension')).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeDisabled();
    expect(
      screen.queryByRole('checkbox', {
        name: 'I understand that a failed migration might require manual recovery.',
      }),
    ).not.toBeInTheDocument();
    await openReview(user);
    expect(screen.getByRole('heading', { name: 'Review and migrate' })).toBeVisible();
    expect(
      screen.queryByRole('checkbox', { name: 'I reviewed the migration plan.' }),
    ).not.toBeInTheDocument();
    expect(dryRunOperatorMigration).toHaveBeenCalledTimes(1);
    expect(startOperatorMigration).not.toHaveBeenCalled();
  });

  it('shows failed checks and prevents review for a blocked operator', async () => {
    (dryRunOperatorMigration as jest.Mock).mockImplementation((request: OperatorMigrationRequest) =>
      Promise.resolve(makeDryRun(request, false)),
    );

    renderModal([makeOperator('operator-one')], false);

    expect(await screen.findByText('A hard migration check failed.')).toBeVisible();
    expect(screen.getByText('Not supported.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Start migration' })).not.toBeInTheDocument();
  });

  it('lets users remove blocked operators and review the remaining plan without another dry run', async () => {
    (dryRunOperatorMigration as jest.Mock).mockImplementation((request: OperatorMigrationRequest) =>
      Promise.resolve(makeDryRun(request, request.subscriptionName === 'operator-one')),
    );
    renderModal([makeOperator('operator-one'), makeOperator('operator-two')], true);
    const user = userEvent.setup();

    const removeBlocked = await screen.findByRole('button', { name: 'Remove blocked Operators' });
    expect(dryRunOperatorMigration).toHaveBeenCalledTimes(2);

    await user.click(removeBlocked);
    await openReview(user);

    expect(dryRunOperatorMigration).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Start migration (1)' })).toBeDisabled();
    expect(screen.queryByText('operator-two display name')).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /operator-one display name/ })).toBeVisible();
  });

  it('requires review acknowledgments and resets them when checking the plan again', async () => {
    renderModal([makeOperator('operator-one')], false);
    const user = userEvent.setup();
    await openReview(user);
    const start = screen.getByRole('button', { name: 'Start migration' });
    expect(start).toBeDisabled();
    await user.click(
      screen.getByRole('checkbox', {
        name: 'I understand that a failed migration might require manual recovery.',
      }),
    );
    expect(start).toBeDisabled();
    await user.click(
      screen.getByRole('checkbox', {
        name: 'I have a backup or recovery plan for the affected resources.',
      }),
    );
    expect(start).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Review migration' }));
    expect(screen.getByRole('button', { name: 'Start migration' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Repeat dry run' }));
    expect(
      screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' }),
    ).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeDisabled();
    await openReview(user);
    expect(screen.getByRole('button', { name: 'Start migration' })).toBeDisabled();
  });

  it('rechecks acknowledged changes and allows users to withdraw their acknowledgment', async () => {
    (dryRunOperatorMigration as jest.Mock).mockImplementation(
      (request: OperatorMigrationRequest) => {
        const result = makeDryRun(request, Boolean(request.acknowledgeWatchScopeChange));
        if (!result.eligible) {
          result.operator.failedChecks = [
            { name: 'Namespace scope change', passed: false, message: 'All namespaces required.' },
          ];
        }
        return Promise.resolve(result);
      },
    );
    renderModal([makeOperator('operator-one')], false);
    const user = userEvent.setup();
    const acknowledgment = await screen.findByRole('checkbox', {
      name: 'I accept that this Operator runs in all namespaces after migration.',
    });
    await user.click(acknowledgment);
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' }),
      ).toBeEnabled(),
    );
    expect(acknowledgment).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' }));
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeEnabled();

    await user.click(acknowledgment);
    expect(await screen.findByText('All namespaces required.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' }),
    ).not.toBeChecked();
  });

  it('lets users retry a failed dry run', async () => {
    (dryRunOperatorMigration as jest.Mock).mockRejectedValueOnce(new Error('Catalog unavailable.'));
    renderModal([makeOperator('operator-one')], false);
    const user = userEvent.setup();

    expect(await screen.findByText('Catalog unavailable.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Repeat dry run' }));

    expect(await screen.findByText('Passed')).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeDisabled();
  });

  it('rechecks only the changed operator for each risk acknowledgment and explicitly refreshes all plans', async () => {
    const acknowledgments: {
      field: keyof OperatorMigrationAcknowledgements;
      label: string;
      check: string;
    }[] = [
      {
        field: 'acknowledgeWatchScopeChange',
        label: 'I accept that this Operator runs in all namespaces after migration.',
        check: 'Namespace scope change',
      },
      {
        field: 'acknowledgeOperatorCondition',
        label:
          'I understand that cluster extensions do not support OperatorCondition, so the Operator cannot use it to block upgrades when it is not ready.',
        check: 'No OperatorCondition usage',
      },
      {
        field: 'acknowledgeOLMv0APIAccess',
        label:
          'I accept that this Operator uses Operator Lifecycle Manager version 0 APIs that cluster extensions do not support, so features that depend on those APIs might stop working after migration.',
        check: 'OLMv0-API RBAC',
      },
      {
        field: 'acknowledgeScopedServiceAccount',
        label: 'I accept that this Operator uses cluster-admin permissions after migration.',
        check: 'No scoped ServiceAccount',
      },
      {
        field: 'acknowledgeNotSteadyState',
        label: 'I accept migrating this Operator before it reaches a healthy, up-to-date state.',
        check: 'CSV health',
      },
    ];
    (dryRunOperatorMigration as jest.Mock).mockImplementation(
      (request: OperatorMigrationRequest) => {
        const failedAcknowledgments =
          request.subscriptionName === 'operator-one'
            ? acknowledgments.filter(({ field }) => !request[field])
            : [];
        const result = makeDryRun(request, failedAcknowledgments.length === 0);
        result.operator.failedChecks = failedAcknowledgments.map(({ check }) => ({
          name: check,
          passed: false,
          message: 'Acknowledgment required.',
        }));
        return Promise.resolve(result);
      },
    );
    renderModal([makeOperator('operator-one'), makeOperator('operator-two')], true);
    const user = userEvent.setup();
    expect(await screen.findByText('Passed')).toBeVisible();

    const acknowledge = async ({ label }: (typeof acknowledgments)[number]) => {
      const checkbox = await screen.findByRole('checkbox', { name: label });
      await waitFor(() => expect(checkbox).toBeEnabled());
      await user.click(checkbox);
      await waitFor(() => expect(checkbox).toBeEnabled());
      expect(checkbox).toBeChecked();
    };
    await acknowledge(acknowledgments[0]);
    await acknowledge(acknowledgments[1]);
    await acknowledge(acknowledgments[2]);
    await acknowledge(acknowledgments[3]);
    await acknowledge(acknowledgments[4]);

    expect(screen.getByRole('button', { name: 'Review migration' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' }));
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeEnabled();
    const otherOperatorCalls = () =>
      (dryRunOperatorMigration as jest.Mock).mock.calls.filter(
        ([request]: [OperatorMigrationRequest]) => request.subscriptionName === 'operator-two',
      );
    expect(otherOperatorCalls()).toHaveLength(1);
    expect(dryRunOperatorMigration).toHaveBeenCalledTimes(7);

    await user.click(screen.getByRole('button', { name: 'Repeat dry run' }));
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' }),
      ).toBeEnabled(),
    );
    expect(
      screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' }),
    ).not.toBeChecked();
    expect(otherOperatorCalls()).toHaveLength(2);
    expect(dryRunOperatorMigration).toHaveBeenCalledTimes(9);
  });

  it('keeps an unaffected plan passed while the changed operator is being rechecked', async () => {
    let finishDryRun: (response: OperatorMigrationDryRunResponse) => void;
    (dryRunOperatorMigration as jest.Mock).mockImplementation(
      (request: OperatorMigrationRequest) => {
        if (request.acknowledgeWatchScopeChange) {
          return new Promise<OperatorMigrationDryRunResponse>((resolve) => {
            finishDryRun = resolve;
          });
        }
        const result = makeDryRun(request, request.subscriptionName === 'operator-two');
        if (!result.eligible) {
          result.operator.failedChecks = [
            { name: 'Namespace scope change', passed: false, message: 'All namespaces required.' },
          ];
        }
        return Promise.resolve(result);
      },
    );
    renderModal([makeOperator('operator-one'), makeOperator('operator-two')], true);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('checkbox', {
        name: 'I accept that this Operator runs in all namespaces after migration.',
      }),
    );

    const plans = screen.getByRole('table', { name: 'Operator migration plans' });
    expect(
      within(within(plans).getByRole('row', { name: /operator-one display name/ })).getByText(
        'Checking',
      ),
    ).toBeVisible();
    expect(
      within(within(plans).getByRole('row', { name: /operator-two display name/ })).getByText(
        'Passed',
      ),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeDisabled();
    expect(dryRunOperatorMigration).toHaveBeenCalledTimes(3);

    await act(async () => finishDryRun(makeDryRun(makeOperator('operator-one'))));
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'I reviewed the migration plan.' }));
    expect(screen.getByRole('button', { name: 'Review migration' })).toBeEnabled();
  });

  it('keeps the dialog open and shows the reason when migration cannot start', async () => {
    (startOperatorMigration as jest.Mock).mockRejectedValue(new Error('Migration access denied.'));
    renderModal([makeOperator('operator-one')], false);
    const user = userEvent.setup();
    await openReview(user);
    await confirmReview(user);
    await user.click(screen.getByRole('button', { name: 'Start migration' }));

    expect(await screen.findByText('Migration access denied.')).toBeVisible();
    expect(
      screen.getByRole('dialog', {
        name: 'Migrate Classic Operators to cluster extensions',
      }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Start migration' })).toBeEnabled();
  });

  it('preserves progress and individual success and rollback notifications after migration starts', async () => {
    (startOperatorMigration as jest.Mock).mockResolvedValue({ jobID: 'job-1' });
    (getOperatorMigrationJob as jest.Mock).mockResolvedValue({
      id: 'job-1',
      status: 'CompletedWithErrors',
      continueOnError: true,
      items: [
        {
          subscriptionName: 'operator-one',
          subscriptionNamespace: 'operators',
          status: 'Succeeded',
        },
        {
          subscriptionName: 'operator-two',
          subscriptionNamespace: 'operators',
          status: 'Failed',
          rollbackAttempted: true,
          rolledBack: true,
          error: 'Migration failed and was rolled back automatically.',
        },
      ],
    });
    renderModal([makeOperator('operator-one'), makeOperator('operator-two')], true);
    const user = userEvent.setup();
    await openReview(user);
    await confirmReview(user);
    await user.click(screen.getByRole('button', { name: 'Start migration (2)' }));

    expect(
      await screen.findByText(
        'operators/operator-one migrated to Operator Lifecycle Manager version 1 cluster extensions successfully.',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        'operators/operator-two migration failed. The console automatically moved the Operator back to Operator Lifecycle Manager version 0. Resolve the error, then try migrating again. Error: Migration failed and was rolled back automatically.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Operator migration completed with errors')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(startOperatorMigration).toHaveBeenCalledWith([
      expect.objectContaining({ subscriptionName: 'operator-one' }),
      expect.objectContaining({ subscriptionName: 'operator-two' }),
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
