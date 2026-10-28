import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import { InternalToastProvider } from '@console/app/src/providers/toast/InternalToastProvider';
import { OverlayProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import type { OperatorMigrationJob } from '../../utils/operator-migration-api';
import {
  getOperatorMigrationJob,
  getOperatorMigrationJobs,
  startOperatorMigrationRollback,
} from '../../utils/operator-migration-api';
import {
  OperatorMigrationNotificationsProvider,
  useOperatorMigrationNotifications,
  useMigrationNotifications,
} from '../operator-migration-notifications';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
jest.mock('../../utils/operator-migration-api', () => ({
  getOperatorMigrationJob: jest.fn(),
  getOperatorMigrationJobs: jest.fn(),
  invalidateOperatorMigrationScans: jest.fn(),
  startOperatorMigrationRollback: jest.fn(),
}));

const running: OperatorMigrationJob = {
  id: 'persisted-job',
  status: 'Running',
  continueOnError: true,
  items: [
    {
      subscriptionName: 'demo',
      subscriptionNamespace: 'operators',
      clusterExtensionName: 'demo',
      status: 'Migrating',
    },
  ],
};

const StartMigration = () => {
  const { monitorMigration } = useMigrationNotifications();
  return (
    <button type="button" onClick={() => monitorMigration(running)}>
      Start migration
    </button>
  );
};

const Notifications = () => {
  const value = useOperatorMigrationNotifications();
  return (
    <OperatorMigrationNotificationsProvider value={value}>
      <span>Console content</span>
      <StartMigration />
    </OperatorMigrationNotificationsProvider>
  );
};
const renderNotifications = () =>
  render(
    <InternalToastProvider>
      <OverlayProvider>
        <Notifications />
      </OverlayProvider>
    </InternalToastProvider>,
  );

const translate = (key: string, values?: Record<string, string | number>): string =>
  key.replace(/{{(\w+)}}/g, (_, name: string) => String(values?.[name] ?? ''));

describe('OperatorMigrationNotifications', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: translate });
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([running]);
    (getOperatorMigrationJob as jest.Mock).mockResolvedValue(running);
  });
  afterEach(() => jest.useRealTimers());

  it('restores an active migration when Console mounts with no browser state', async () => {
    const { unmount } = renderNotifications();
    expect(await screen.findByText('Operator migration in progress')).toBeVisible();
    expect(screen.getByRole('progressbar')).toBeVisible();
    expect(screen.getByText('Console content')).toBeVisible();
    unmount();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    renderNotifications();
    expect(await screen.findByText('Operator migration in progress')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('reconnects after a backend outage and reports the saved result', async () => {
    (getOperatorMigrationJobs as jest.Mock)
      .mockRejectedValueOnce(new HttpError('backend restarting', 503))
      .mockResolvedValue([running]);
    (getOperatorMigrationJob as jest.Mock)
      .mockRejectedValueOnce(new HttpError('backend restarting', 503))
      .mockResolvedValue({
        ...running,
        status: 'Succeeded',
        items: [{ ...running.items[0], status: 'Succeeded' }],
      });
    renderNotifications();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });
    expect(getOperatorMigrationJobs).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Could not refresh migration status. Retrying.')).toBeVisible();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });
    expect(
      await screen.findByText(
        'operators/demo migrated to Operator Lifecycle Manager version 1 cluster extensions successfully.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('does not restore completed migrations', async () => {
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([
      { ...running, status: 'Succeeded' },
    ]);
    const { unmount } = renderNotifications();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    unmount();
  });

  it('restores failures and recovery actions completed while Console was closed without repeating dismissed results', async () => {
    const failed: OperatorMigrationJob = {
      ...running,
      status: 'CompletedWithErrors',
      items: [
        {
          ...running.items[0],
          status: 'Failed',
          recoveryRequired: true,
          error: 'Authorization expired',
        },
      ],
    };
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([failed]);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { unmount } = renderNotifications();

    expect(
      await screen.findByText(
        'operators/demo migration failed. Review the error and verify the Operator status before you try migrating again. Error: Authorization expired',
      ),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Roll back to Classic Operators' })).toBeVisible();
    expect(screen.getByText('Operator migration completed with errors')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /^Close/ }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });
    expect(
      screen.queryByRole('button', { name: 'Roll back to Classic Operators' }),
    ).not.toBeInTheDocument();
    expect(getOperatorMigrationJob).not.toHaveBeenCalled();

    unmount();
    renderNotifications();
    await user.click(await screen.findByRole('button', { name: 'Roll back to Classic Operators' }));
    expect(screen.getByRole('dialog', { name: /Roll back to Classic Operators/ })).toBeVisible();
  });

  it('restores a job failure that occurred before any operator could run', async () => {
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([
      {
        ...running,
        status: 'Failed',
        message: 'Authorization expired',
        items: [{ ...running.items[0], status: 'Queued' }],
      },
    ]);
    renderNotifications();

    expect(await screen.findByText('Operator migration failed')).toBeVisible();
    expect(
      screen.getByText(
        'Migration job failed. Review the error and the Operator results before you try again. Error: Authorization expired',
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Roll back to Classic Operators' }),
    ).not.toBeInTheDocument();
    expect(getOperatorMigrationJob).not.toHaveBeenCalled();
  });

  it('suppresses an obsolete migration failure after successful rollback', async () => {
    const failed: OperatorMigrationJob = {
      ...running,
      status: 'Failed',
      items: [
        {
          ...running.items[0],
          status: 'Failed',
          rollbackAttempted: true,
          error: 'Original failure',
        },
      ],
    };
    const restored: OperatorMigrationJob = {
      ...running,
      id: 'rollback-job',
      operation: 'Rollback',
      sourceJobID: failed.id,
      status: 'Succeeded',
      items: [{ ...running.items[0], status: 'Succeeded', rolledBack: true }],
    };
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([failed, restored]);
    renderNotifications();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Roll back to Classic Operators' }),
    ).not.toBeInTheDocument();
    expect(getOperatorMigrationJob).not.toHaveBeenCalled();
  });

  it('restores the latest failed rollback against the original job without replaying its obsolete failure', async () => {
    const failed: OperatorMigrationJob = {
      ...running,
      status: 'Failed',
      items: [
        {
          ...running.items[0],
          status: 'Failed',
          rollbackAttempted: true,
          error: 'Original failure',
        },
      ],
    };
    const recovery: OperatorMigrationJob = {
      ...failed,
      id: 'rollback-job',
      operation: 'Rollback',
      sourceJobID: failed.id,
      items: [{ ...failed.items[0], error: 'Deletion denied' }],
    };
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([failed, recovery]);
    (startOperatorMigrationRollback as jest.Mock).mockRejectedValue(new Error('Access denied'));
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderNotifications();

    expect(
      await screen.findByText(
        'operators/demo rollback failed. The console kept the recovery data. Review the error before you retry rollback. Error: Deletion denied',
      ),
    ).toBeVisible();
    expect(screen.queryByText(/Original failure/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Roll back to Classic Operators' }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Roll back' }));
    expect(startOperatorMigrationRollback).toHaveBeenCalledWith(failed.id, 'demo');
    expect(await screen.findByText('Access denied')).toBeVisible();
  });

  it('reports each completed bulk operator immediately without repeating dismissed results', async () => {
    const batch: OperatorMigrationJob = {
      ...running,
      items: [
        { ...running.items[0], status: 'Succeeded' },
        {
          ...running.items[0],
          subscriptionName: 'second',
          clusterExtensionName: 'second',
          status: 'Migrating',
        },
      ],
    };
    (getOperatorMigrationJob as jest.Mock)
      .mockResolvedValueOnce(batch)
      .mockResolvedValueOnce(batch)
      .mockResolvedValue({
        ...batch,
        status: 'Succeeded',
        items: batch.items.map((item) => ({ ...item, status: 'Succeeded' })),
      });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderNotifications();

    expect(
      await screen.findByText(
        'operators/demo migrated to Operator Lifecycle Manager version 1 cluster extensions successfully.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Operator migration in progress')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(
      screen.queryByText(
        'operators/second migrated to Operator Lifecycle Manager version 1 cluster extensions successfully.',
      ),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Close/ }));

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });
    expect(
      screen.queryByText(
        'operators/demo migrated to Operator Lifecycle Manager version 1 cluster extensions successfully.',
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });
    expect(
      await screen.findByText(
        'operators/second migrated to Operator Lifecycle Manager version 1 cluster extensions successfully.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByText(
        'operators/demo migrated to Operator Lifecycle Manager version 1 cluster extensions successfully.',
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('reports a bulk failure immediately and offers manual rollback after the batch finishes', async () => {
    const batch: OperatorMigrationJob = {
      ...running,
      items: [
        {
          ...running.items[0],
          status: 'Failed',
          rollbackAttempted: true,
          error: 'Target resources may be active',
        },
        {
          ...running.items[0],
          subscriptionName: 'second',
          clusterExtensionName: 'second',
          status: 'Migrating',
        },
      ],
    };
    (getOperatorMigrationJob as jest.Mock).mockResolvedValueOnce(batch).mockResolvedValue({
      ...batch,
      status: 'CompletedWithErrors',
      items: [batch.items[0], { ...batch.items[1], status: 'Succeeded' }],
    });
    renderNotifications();

    expect(
      await screen.findByText(
        'operators/demo migration failed, and automatic rollback did not finish. After the migration batch finishes, use the rollback action in the failure notification. Error: Target resources may be active',
      ),
    ).toBeVisible();
    expect(screen.getByText('Operator migration in progress')).toBeVisible();
    expect(
      screen.getByText(
        'After this batch finishes, use the rollback action in the failure notification to move the Operator back to Operator Lifecycle Manager version 0.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Roll back to Classic Operators' }),
    ).not.toBeInTheDocument();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });

    expect(
      await screen.findByRole('button', { name: 'Roll back to Classic Operators' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'operators/second migrated to Operator Lifecycle Manager version 1 cluster extensions successfully.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Operator migration completed with errors')).toBeVisible();
    expect(
      screen.getByText(
        'To move the Operator back to Operator Lifecycle Manager version 0, select Roll back to Classic Operators in this notification, review the rollback warning, and confirm rollback.',
      ),
    ).toBeVisible();
    expect(screen.queryByText(/After this batch finishes/)).not.toBeInTheDocument();
  });

  it('stops job discovery after an authorization failure', async () => {
    for (const code of [401, 403]) {
      (getOperatorMigrationJobs as jest.Mock)
        .mockClear()
        .mockRejectedValue(new HttpError('Access denied', code));
      const { unmount } = renderNotifications();
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        await jest.advanceTimersByTimeAsync(10000);
      });

      expect(getOperatorMigrationJobs).toHaveBeenCalledTimes(1);
      expect(getOperatorMigrationJob).not.toHaveBeenCalled();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByText('Console content')).toBeVisible();
      unmount();
    }
  });

  it('shows a distinct progress toast title for each terminal job status', async () => {
    const cases: { status: OperatorMigrationJob['status']; title: string }[] = [
      { status: 'Succeeded', title: 'Operator migration completed' },
      { status: 'CompletedWithErrors', title: 'Operator migration completed with errors' },
      { status: 'Failed', title: 'Operator migration failed' },
      { status: 'Cancelled', title: 'Operator migration canceled' },
    ];
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([]);
    for (const { status, title } of cases) {
      (getOperatorMigrationJob as jest.Mock).mockResolvedValue({ ...running, status });
      const { unmount } = renderNotifications();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      // eslint-disable-next-line no-await-in-loop
      await user.click(screen.getByRole('button', { name: 'Start migration' }));

      // eslint-disable-next-line no-await-in-loop
      expect(await screen.findByText(title)).toBeVisible();
      expect(screen.queryByText('Operator migration in progress')).not.toBeInTheDocument();
      unmount();
    }
  });

  it('confirms explicit recovery and monitors rollback after the overlay closes', async () => {
    const failure: OperatorMigrationJob = {
      ...running,
      status: 'CompletedWithErrors',
      items: [
        {
          ...running.items[0],
          status: 'Failed',
          rollbackAttempted: true,
          error: 'Target resources may be active',
        },
      ],
    };
    (getOperatorMigrationJob as jest.Mock).mockImplementation((id: string) =>
      Promise.resolve(
        id === 'recovery-job'
          ? {
              ...running,
              id,
              sourceJobID: running.id,
              operation: 'Rollback',
              status: 'Succeeded',
              items: [{ ...running.items[0], status: 'Succeeded', rolledBack: true }],
            }
          : failure,
      ),
    );
    (startOperatorMigrationRollback as jest.Mock).mockResolvedValue({
      jobID: 'recovery-job',
      status: 'Queued',
    });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderNotifications();
    await user.click(await screen.findByRole('button', { name: 'Roll back to Classic Operators' }));
    expect(screen.getByRole('dialog', { name: /Roll back to Classic Operators/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Roll back' })).toBeDisabled();
    await user.click(
      screen.getByRole('checkbox', {
        name: 'I understand that rollback removes the migration resources and moves the Operator back to Operator Lifecycle Manager version 0.',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Roll back' }));

    expect(startOperatorMigrationRollback).toHaveBeenCalledWith(running.id, 'demo');
    expect(
      await screen.findByText(
        'The console restored operators/demo to Operator Lifecycle Manager version 0.',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Roll back to Classic Operators' }),
    ).not.toBeInTheDocument();
  });

  it('does not offer rollback for successful or automatically restored operators', async () => {
    const result: OperatorMigrationJob = {
      ...running,
      status: 'CompletedWithErrors',
      items: [
        { ...running.items[0], status: 'Succeeded' },
        {
          ...running.items[0],
          subscriptionName: 'restored',
          status: 'Failed',
          rollbackAttempted: true,
          rolledBack: true,
        },
      ],
    };
    (getOperatorMigrationJob as jest.Mock).mockResolvedValue(result);
    renderNotifications();

    expect(
      await screen.findByText(
        'operators/demo migrated to Operator Lifecycle Manager version 1 cluster extensions successfully.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Roll back to Classic Operators' }),
    ).not.toBeInTheDocument();
  });

  it('retries failed recovery against the original migration job', async () => {
    const recovery: OperatorMigrationJob = {
      ...running,
      operation: 'Rollback',
      sourceJobID: 'original-job',
      status: 'Failed',
      items: [
        {
          ...running.items[0],
          status: 'Failed',
          rollbackAttempted: true,
          error: 'Deletion denied',
        },
      ],
    };
    (getOperatorMigrationJob as jest.Mock).mockResolvedValue(recovery);
    (startOperatorMigrationRollback as jest.Mock).mockRejectedValue(new Error('Access denied'));
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderNotifications();
    await user.click(await screen.findByRole('button', { name: 'Roll back to Classic Operators' }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Roll back' }));

    expect(startOperatorMigrationRollback).toHaveBeenCalledWith('original-job', 'demo');
    expect(await screen.findByText('Access denied')).toBeVisible();
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('restores an active rollback notification when Console reloads', async () => {
    const recovery = { ...running, operation: 'Rollback' as const, sourceJobID: 'original-job' };
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([recovery]);
    (getOperatorMigrationJob as jest.Mock).mockResolvedValue(recovery);
    renderNotifications();

    expect(await screen.findByText('Operator rollback in progress')).toBeVisible();
    expect(
      screen.getByText('Restoring Operator Lifecycle Manager version 0 resources'),
    ).toBeVisible();
  });

  it('starts monitoring through context without duplicate polls', async () => {
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([]);
    renderNotifications();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(screen.getByRole('button', { name: 'Start migration' }));
    await user.click(screen.getByRole('button', { name: 'Start migration' }));

    expect(await screen.findByText('Operator migration in progress')).toBeVisible();
    expect(getOperatorMigrationJob).toHaveBeenCalledTimes(1);
  });

  it('stops polling when the notification provider unmounts', async () => {
    const { unmount } = renderNotifications();
    expect(await screen.findByText('Operator migration in progress')).toBeVisible();

    unmount();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });

    expect(getOperatorMigrationJob).toHaveBeenCalledTimes(1);
    expect(getOperatorMigrationJobs).toHaveBeenCalledTimes(1);
  });

  it('uses updated translations without restarting job discovery', async () => {
    const progress = {
      ...running,
      progressEvent: { step: 'create', status: 'started', message: 'Upstream phase wording' },
    };
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([progress]);
    (getOperatorMigrationJob as jest.Mock).mockResolvedValue(progress);
    const { rerender } = renderNotifications();
    expect(await screen.findByText('Operator migration in progress')).toBeVisible();
    expect(
      screen.getByText('Creating Operator Lifecycle Manager version 1 cluster extension resources'),
    ).toBeVisible();
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, values?: Record<string, string | number>) =>
        `Translated: ${translate(key, values)}`,
    });

    rerender(
      <InternalToastProvider>
        <OverlayProvider>
          <Notifications />
        </OverlayProvider>
      </InternalToastProvider>,
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });

    expect(await screen.findByText('Translated: Operator migration in progress')).toBeVisible();
    expect(
      screen.getByRole('progressbar', { name: 'Translated: 0 of 1 Operators processed' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Translated: Creating Operator Lifecycle Manager version 1 cluster extension resources',
      ),
    ).toBeVisible();
    expect(screen.queryByText('Upstream phase wording')).not.toBeInTheDocument();
    expect(getOperatorMigrationJobs).toHaveBeenCalledTimes(1);
  });

  it('leaves detailed library waiting messages in English', async () => {
    const message = 'Waiting for ClusterExtension demo to reach Installed=True...';
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, values?: Record<string, string | number>) =>
        `Translated: ${translate(key, values)}`,
    });
    const progress = {
      ...running,
      progressEvent: { step: 'create', status: 'waiting', target: 'operators/demo', message },
    };
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([progress]);
    (getOperatorMigrationJob as jest.Mock).mockResolvedValue(progress);

    renderNotifications();

    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getByText('Translated: Operator migration in progress')).toBeVisible();
    expect(screen.queryByText(`Translated: ${message}`)).not.toBeInTheDocument();
  });

  it('shows translated phase completion when the library provides no message', async () => {
    const progress = {
      ...running,
      progressEvent: { step: 'backup', status: 'completed' },
    };
    (getOperatorMigrationJobs as jest.Mock).mockResolvedValue([progress]);
    (getOperatorMigrationJob as jest.Mock).mockResolvedValue(progress);

    renderNotifications();

    expect(await screen.findByText('Backup complete')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
