import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import { InternalToastProvider } from '@console/app/src/providers/toast/InternalToastProvider';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import type { OperatorMigrationJob } from '../../utils/operator-migration-api';
import {
  getOperatorMigrationJob,
  getOperatorMigrationJobs,
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
      <Notifications />
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
      await screen.findByText('operators/demo migrated to OLM v1 successfully.'),
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
      { status: 'Cancelled', title: 'Operator migration cancelled' },
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
    expect(screen.getByText('Creating OLMv1 migration resources')).toBeVisible();
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, values?: Record<string, string | number>) =>
        `Translated: ${translate(key, values)}`,
    });

    rerender(
      <InternalToastProvider>
        <Notifications />
      </InternalToastProvider>,
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });

    expect(await screen.findByText('Translated: Operator migration in progress')).toBeVisible();
    expect(
      screen.getByRole('progressbar', { name: 'Translated: 0 of 1 operators processed' }),
    ).toBeVisible();
    expect(screen.getByText('Translated: Creating OLMv1 migration resources')).toBeVisible();
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

    expect(await screen.findByText('backup complete')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
