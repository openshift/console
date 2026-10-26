import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { OperatorMigrationJob, OperatorMigrationProgress } from './operator-migration-api';

/** Provides translated phase and job labels that update with the current language. */
export const useOperatorMigrationProgressText = () => {
  const { t } = useTranslation('olm');
  return useMemo(() => {
    /** Translates typed phase labels and preserves unstructured library diagnostics in English. */
    const getOperatorMigrationProgressText = (progress: OperatorMigrationProgress): string => {
      const { step, status, message = '', error } = progress;
      let text: string;
      // Intermediate messages contain details that the library does not expose as
      // structured fields. Keep them in English without parsing their text.
      if (['waiting', 'note', 'warning', 'completed'].includes(status) && message) {
        return error && error !== message ? `${message}: ${error}` : message;
      }
      if (status === 'completed') {
        switch (step) {
          case 'profile':
            text = t('Configuration review complete');
            break;
          case 'check':
            text = t('Check complete');
            break;
          case 'catalog':
            text = t('Catalog complete');
            break;
          case 'collect':
            text = t('Resource checks complete');
            break;
          case 'backup':
            text = t('Backup complete');
            break;
          case 'prepare':
            text = t('Prepare complete');
            break;
          case 'create':
            text = t('Create complete');
            break;
          case 'cleanup':
            text = t('Cleanup complete');
            break;
          case 'scan':
            text = t('Scan complete');
            break;
          case 'rollback':
            text = t('Rollback complete');
            break;
          default:
            text = t('Migration completed');
        }
      } else if (status === 'failed') {
        text = t('Migration failed');
      } else if (status === 'warning') {
        text = t('Migration warning');
      } else {
        switch (step) {
          case 'profile':
            text = t('Reading Operator configuration');
            break;
          case 'check':
            text = t('Checking readiness and compatibility');
            break;
          case 'catalog':
            text = t('Determining target ClusterCatalog');
            break;
          case 'collect':
            text = t('Collecting and checking Operator resources');
            break;
          case 'backup':
            text = t('Backing up OLM (Classic) resources');
            break;
          case 'prepare':
            text = t('Preparing Operator for migration');
            break;
          case 'create':
            text = t('Creating OLM v1 cluster extension resources');
            break;
          case 'cleanup':
            text = t('Cleaning up OLM (Classic) resources');
            break;
          case 'scan':
            text = t('Scanning all OLM (Classic) Subscriptions');
            break;
          case 'rollback':
            text = t('Restoring OLM (Classic) resources');
            break;
          default:
            text = t('Operator migration in progress');
        }
      }
      // Diagnostic errors originate in Kubernetes and are not translation keys.
      const detail = error || (status === 'failed' ? message : '');
      return detail ? t('{{message}}: {{error}}', { message: text, error: detail }) : text;
    };

    /** Uses structured progress and job state, preserving legacy progress messages when present. */
    const getOperatorMigrationJobProgressText = (job: OperatorMigrationJob): string => {
      if (job.operation === 'Rollback') {
        switch (job.status) {
          case 'Queued':
            return t('Preparing Operator rollback');
          case 'Succeeded':
            return t('Operator rollback completed');
          case 'Failed':
            return t('Operator rollback failed');
          default:
            return job.progressEvent
              ? getOperatorMigrationProgressText(job.progressEvent)
              : t('Restoring OLM (Classic) resources');
        }
      }
      switch (job.status) {
        case 'Queued':
          return t('Preparing Operator migration');
        case 'Scanning':
          return job.progressEvent
            ? getOperatorMigrationProgressText(job.progressEvent)
            : t('Scanning all OLM (Classic) Subscriptions');
        case 'CancelRequested':
          return t('Cancellation requested');
        case 'Cancelled':
          return t('Migration job canceled');
        case 'CompletedWithErrors':
          return t('One or more Operators failed. Review the results for each Operator.');
        case 'Failed':
          return job.message
            ? t('Migration job failed: {{error}}', { error: job.message })
            : t('Migration job failed');
        case 'Succeeded':
          return job.items.every(({ status }) => status === 'Skipped')
            ? t('No eligible Operators to migrate')
            : t('Migration job completed');
        default: {
          if (job.progressEvent) return getOperatorMigrationProgressText(job.progressEvent);
          if (job.message) return job.message;
          const item = job.items.find(
            ({ status }) => status === 'Checking' || status === 'Migrating',
          );
          if (item) {
            const operator = `${item.subscriptionNamespace}/${item.subscriptionName}`;
            return item.status === 'Checking'
              ? t('Checking {{operator}}', { operator })
              : t('Migrating {{operator}}', { operator });
          }
          return t('Preparing Operator migration');
        }
      }
    };

    return { getOperatorMigrationProgressText, getOperatorMigrationJobProgressText };
  }, [t]);
};
