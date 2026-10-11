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
            text = t('profile complete');
            break;
          case 'check':
            text = t('check complete');
            break;
          case 'catalog':
            text = t('catalog complete');
            break;
          case 'collect':
            text = t('collect complete');
            break;
          case 'backup':
            text = t('backup complete');
            break;
          case 'prepare':
            text = t('prepare complete');
            break;
          case 'create':
            text = t('create complete');
            break;
          case 'cleanup':
            text = t('cleanup complete');
            break;
          case 'scan':
            text = t('scan complete');
            break;
          case 'rollback':
            text = t('rollback complete');
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
            text = t('Profiling operator');
            break;
          case 'check':
            text = t('Checking readiness and compatibility');
            break;
          case 'catalog':
            text = t('Determining target ClusterCatalog');
            break;
          case 'collect':
            text = t('Collecting and preflighting operator resources');
            break;
          case 'backup':
            text = t('Backing up OLMv0 resources');
            break;
          case 'prepare':
            text = t('Preparing operator for migration');
            break;
          case 'create':
            text = t('Creating OLMv1 migration resources');
            break;
          case 'cleanup':
            text = t('Cleaning up OLMv0 resources');
            break;
          case 'scan':
            text = t('Scanning all OLMv0 Subscriptions');
            break;
          case 'rollback':
            text = t('Restoring OLMv0 resources');
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
      switch (job.status) {
        case 'Queued':
          return t('Preparing operator migration');
        case 'Scanning':
          return job.progressEvent
            ? getOperatorMigrationProgressText(job.progressEvent)
            : t('Scanning all OLMv0 Subscriptions');
        case 'CancelRequested':
          return t('Cancellation requested');
        case 'Cancelled':
          return t('Migration job was cancelled');
        case 'CompletedWithErrors':
          return t('One or more operators failed; review the per-operator results');
        case 'Failed':
          return job.message
            ? t('Migration job failed: {{error}}', { error: job.message })
            : t('Migration job failed');
        case 'Succeeded':
          return job.items.every(({ status }) => status === 'Skipped')
            ? t('No eligible operators to migrate')
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
          return t('Preparing operator migration');
        }
      }
    };

    return { getOperatorMigrationProgressText, getOperatorMigrationJobProgressText };
  }, [t]);
};
