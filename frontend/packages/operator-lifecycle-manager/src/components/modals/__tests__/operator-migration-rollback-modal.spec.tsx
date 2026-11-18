import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { startOperatorMigrationRollback } from '../../../utils/operator-migration-api';
import { OperatorMigrationRollbackModalOverlay } from '../operator-migration-rollback-modal';

jest.mock('react-i18next');
jest.mock('../../../utils/operator-migration-api', () => ({
  startOperatorMigrationRollback: jest.fn(),
}));

const renderModal = () => {
  const monitorMigration = jest.fn().mockResolvedValue(undefined);
  const onRollbackStarted = jest.fn();
  const closeOverlay = jest.fn();
  render(
    <OperatorMigrationRollbackModalOverlay
      jobID="failed-job"
      item={{
        subscriptionName: 'demo',
        subscriptionNamespace: 'operators',
        clusterExtensionName: 'demo',
        status: 'Failed',
        rollbackAttempted: true,
      }}
      monitorMigration={monitorMigration}
      onRollbackStarted={onRollbackStarted}
      closeOverlay={closeOverlay}
    />,
  );
  return { monitorMigration, onRollbackStarted, closeOverlay };
};

describe('OperatorMigrationRollbackModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('explains the resource removal and cancels without requesting rollback', async () => {
    const user = userEvent.setup();
    const { closeOverlay } = renderModal();
    expect(
      screen.getByText(/Rollback removes the ClusterExtension and ClusterObjectSets/),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Roll back' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(closeOverlay).toHaveBeenCalledTimes(1);
    expect(startOperatorMigrationRollback).not.toHaveBeenCalled();
  });

  it('requires acknowledgment and hands accepted recovery to the notification monitor', async () => {
    (startOperatorMigrationRollback as jest.Mock).mockResolvedValue({
      jobID: 'recovery-job',
      status: 'Queued',
    });
    const user = userEvent.setup();
    const { monitorMigration, onRollbackStarted, closeOverlay } = renderModal();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Roll back' }));

    expect(startOperatorMigrationRollback).toHaveBeenCalledWith('failed-job', 'demo');
    expect(monitorMigration).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'recovery-job',
        operation: 'Rollback',
        sourceJobID: 'failed-job',
      }),
    );
    expect(onRollbackStarted).toHaveBeenCalledTimes(1);
    expect(closeOverlay).toHaveBeenCalledTimes(1);
  });

  it('retains the confirmation and allows retry when submission fails', async () => {
    (startOperatorMigrationRollback as jest.Mock).mockRejectedValue(
      new Error('Recovery permission denied'),
    );
    const user = userEvent.setup();
    const { closeOverlay, monitorMigration } = renderModal();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Roll back' }));

    expect(await screen.findByText('Recovery permission denied')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Roll back' })).toBeEnabled();
    expect(closeOverlay).not.toHaveBeenCalled();
    expect(monitorMigration).not.toHaveBeenCalled();
  });
});
