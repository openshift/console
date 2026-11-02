import { renderHook } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { t } from '@console/shared/src/test-utils/i18n-test-utils';
import type { OperatorMigrationJob } from '../operator-migration-api';
import { useOperatorMigrationProgressText } from '../operator-migration-progress';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));

const job: OperatorMigrationJob = {
  id: 'demo-job',
  status: 'Running',
  continueOnError: true,
  items: [{ subscriptionName: 'demo', subscriptionNamespace: 'operators', status: 'Migrating' }],
};

describe('useOperatorMigrationProgressText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t });
  });

  it('uses the library wording with sentence case for standalone phase messages', () => {
    const { result } = renderHook(useOperatorMigrationProgressText);
    [
      ['profile', 'Reading Operator configuration', 'Configuration review complete'],
      ['check', 'Checking readiness and compatibility', 'Check complete'],
      ['catalog', 'Determining target ClusterCatalog', 'Catalog complete'],
      ['collect', 'Collecting and checking Operator resources', 'Resource checks complete'],
      ['backup', 'Backing up OLM (Classic) resources', 'Backup complete'],
      ['prepare', 'Preparing Operator for migration', 'Prepare complete'],
      ['create', 'Creating OLM v1 cluster extension resources', 'Create complete'],
      ['cleanup', 'Cleaning up OLM (Classic) resources', 'Cleanup complete'],
      ['scan', 'Scanning all OLM (Classic) Subscriptions', 'Scan complete'],
      ['rollback', 'Restoring OLM (Classic) resources', 'Rollback complete'],
    ].forEach(([step, expected, completed]) => {
      expect(
        result.current.getOperatorMigrationProgressText({
          step,
          status: 'started',
          message: 'Changed upstream wording',
        }),
      ).toBe(expected);
      expect(result.current.getOperatorMigrationProgressText({ step, status: 'completed' })).toBe(
        completed,
      );
    });
  });

  it('keeps unstructured library messages unchanged', () => {
    const { result } = renderHook(useOperatorMigrationProgressText);
    ['waiting', 'note', 'warning', 'completed'].forEach((status) => {
      const message = 'Any upstream text, including resource names and conditions';
      expect(
        result.current.getOperatorMigrationProgressText({ step: 'create', status, message }),
      ).toBe(message);
    });
  });

  it('keeps diagnostics separate and does not duplicate errors', () => {
    const { result } = renderHook(useOperatorMigrationProgressText);
    expect(
      result.current.getOperatorMigrationProgressText({
        step: 'backup',
        status: 'warning',
        message: 'Backup warning',
        error: 'disk full',
      }),
    ).toBe('Backup warning: disk full');
    expect(
      result.current.getOperatorMigrationProgressText({
        step: 'create',
        status: 'failed',
        message: 'access denied',
        error: 'access denied',
      }),
    ).toBe('Migration failed: access denied');
  });

  it('uses a translated fallback for unknown phases', () => {
    const { result } = renderHook(useOperatorMigrationProgressText);
    expect(
      result.current.getOperatorMigrationProgressText({
        step: 'new-phase',
        status: 'started',
        message: 'Unknown message',
      }),
    ).toBe('Operator migration in progress');
  });

  it('supports old persisted jobs with no structured event', () => {
    const { result } = renderHook(useOperatorMigrationProgressText);
    expect(
      result.current.getOperatorMigrationJobProgressText({
        ...job,
        message: 'Waiting for ClusterExtension demo to reach Installed=True...',
      }),
    ).toBe('Waiting for ClusterExtension demo to reach Installed=True...');
    expect(result.current.getOperatorMigrationJobProgressText(job)).toBe(
      'Migrating operators/demo',
    );
    expect(
      result.current.getOperatorMigrationJobProgressText({
        ...job,
        items: [{ ...job.items[0], status: 'Checking' }],
      }),
    ).toBe('Checking operators/demo');
  });

  it('prefers terminal job status over a stale progress event', () => {
    const { result } = renderHook(useOperatorMigrationProgressText);
    expect(
      result.current.getOperatorMigrationJobProgressText({
        ...job,
        status: 'CancelRequested',
        progressEvent: { step: 'create', status: 'waiting', message: 'Waiting' },
      }),
    ).toBe('Cancellation requested');
    expect(
      result.current.getOperatorMigrationJobProgressText({ ...job, status: 'CompletedWithErrors' }),
    ).toBe('One or more Operators failed. Review the results for each Operator.');
    expect(
      result.current.getOperatorMigrationJobProgressText({
        ...job,
        status: 'Succeeded',
        items: [{ ...job.items[0], status: 'Succeeded' }],
      }),
    ).toBe('Migration job completed');
    expect(
      result.current.getOperatorMigrationJobProgressText({
        ...job,
        status: 'Succeeded',
        items: [],
      }),
    ).toBe('No eligible Operators to migrate');
  });

  it('updates translations when the language changes and retains English details', () => {
    const { result, rerender } = renderHook(useOperatorMigrationProgressText);
    const progress = { step: 'create', status: 'started' };
    expect(result.current.getOperatorMigrationProgressText(progress)).toBe(
      'Creating OLM v1 cluster extension resources',
    );
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => `Translated: ${key}`,
    });

    rerender();

    expect(result.current.getOperatorMigrationProgressText(progress)).toBe(
      'Translated: Creating OLM v1 cluster extension resources',
    );
    expect(
      result.current.getOperatorMigrationJobProgressText({ ...job, status: 'Cancelled' }),
    ).toBe('Translated: Migration job canceled');
    expect(
      result.current.getOperatorMigrationProgressText({
        step: 'create',
        status: 'waiting',
        message: 'Library detail',
      }),
    ).toBe('Library detail');
  });
});
