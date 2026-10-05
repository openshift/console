import type { FC, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Status, IconStatus } from '@patternfly/react-component-groups/dist/dynamic/Status';
import { Button, Content, Popover } from '@patternfly/react-core';
import {
  RhUiCheckCircleFillIcon,
  RhUiErrorFillIcon,
  RhUiInformationFillIcon,
} from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import type { GetDataViewCell } from '@console/dynamic-plugin-sdk/src/extensions/dataview';
import { DASH } from '@console/shared/src/constants/ui';
import { subscriptionForCSV } from '../status/csv-status';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../types';
import {
  getOperatorMigrationScans,
  OPERATOR_MIGRATION_SCAN_INVALIDATED_EVENT,
  type OperatorMigrationScan,
} from '../utils/operator-migration-api';

type InstalledOperator = ClusterServiceVersionKind | SubscriptionKind;

type EligibilityRowData = {
  subscriptions: SubscriptionKind[];
};

const useOperatorMigrationScan = (
  subscriptionNamespace: string,
  subscriptionName: string,
): { scan?: OperatorMigrationScan; loading: boolean; error?: Error } => {
  const [scanState, setScanState] = useState<{
    data?: Awaited<ReturnType<typeof getOperatorMigrationScans>>;
    error?: Error;
    loading: boolean;
  }>({ loading: true });

  useEffect(() => {
    let isMounted = true;
    const loadScans = () => {
      setScanState((current) => ({ ...current, loading: true }));
      getOperatorMigrationScans()
        .then((data) => isMounted && setScanState({ data, loading: false }))
        .catch((error: Error) => isMounted && setScanState({ error, loading: false }));
    };
    loadScans();
    window.addEventListener(OPERATOR_MIGRATION_SCAN_INVALIDATED_EVENT, loadScans);
    return () => {
      isMounted = false;
      window.removeEventListener(OPERATOR_MIGRATION_SCAN_INVALIDATED_EVENT, loadScans);
    };
  }, []);

  if (scanState.loading) {
    return { loading: true };
  }
  if (scanState.error) {
    return { loading: false, error: scanState.error };
  }

  return {
    scan: scanState.data?.find(
      (item) =>
        item.subscriptionNamespace === subscriptionNamespace &&
        item.subscriptionName === subscriptionName,
    ),
    loading: false,
  };
};

const OperatorMigrationEligibilityCell: FC<{
  subscriptionName: string;
  subscriptionNamespace: string;
}> = ({ subscriptionName, subscriptionNamespace }) => {
  const { t } = useTranslation('olm');
  const { scan, loading, error } = useOperatorMigrationScan(
    subscriptionNamespace,
    subscriptionName,
  );

  if (loading) {
    return <span>{t('Scanning...')}</span>;
  }
  if (error) {
    return <span title={error.message}>{t('Scan unavailable')}</span>;
  }
  if (!scan) {
    return <span>{t('Not scanned')}</span>;
  }

  let statusText: string;
  let status: IconStatus = IconStatus.custom;
  let icon: ReactElement | undefined;
  switch (scan.status) {
    case 'Eligible':
      statusText = t('Eligible');
      status = IconStatus.success;
      icon = <RhUiCheckCircleFillIcon />;
      break;
    case 'Ineligible':
      statusText = t('Not eligible');
      status = IconStatus.warning;
      icon = <RhUiInformationFillIcon />;
      break;
    case 'AlreadyMigrated':
      statusText = t('Already migrated');
      status = IconStatus.info;
      icon = <RhUiCheckCircleFillIcon />;
      break;
    case 'Conflict':
      statusText = t('Conflict');
      status = IconStatus.danger;
      icon = <RhUiErrorFillIcon />;
      break;
    default:
      statusText = scan.eligible ? t('Eligible') : t('Ineligible');
  }
  const failedChecks = scan.failedChecks?.filter(({ passed }) => !passed) ?? [];
  const summary =
    scan.reason ||
    (scan.status === 'AlreadyMigrated'
      ? t('This operator is already managed by Next-Gen Operators.')
      : scan.eligible
        ? t('This operator can be migrated to Next-Gen Operators.')
        : t('Review the migration checks before continuing.'));

  return (
    <Popover
      aria-label={t('Migration status for {{operator}}', { operator: subscriptionName })}
      headerContent={statusText}
      bodyContent={
        <>
          <Content component="p">{summary}</Content>
          {failedChecks.length > 0 && (
            <Content component="ul" className="pf-v6-u-mt-sm">
              {failedChecks.map(({ name, message }) => (
                <Content component="li" key={name}>
                  <strong>{name}:</strong> {message}
                </Content>
              ))}
            </Content>
          )}
        </>
      }
    >
      <Button
        data-test="operator-migration-status"
        variant="link"
        isInline
        aria-label={t('Migration status: {{status}}', { status: statusText })}
      >
        <Status status={status} icon={icon} label={statusText} />
      </Button>
    </Popover>
  );
};

export const getOperatorMigrationEligibilityCell: GetDataViewCell<
  InstalledOperator,
  EligibilityRowData
> = (data) =>
  data.map(({ obj, rowData }) => {
    const subscription =
      obj.kind === 'Subscription'
        ? obj
        : subscriptionForCSV(rowData.subscriptions, obj as ClusterServiceVersionKind);
    return {
      cell: subscription ? (
        <OperatorMigrationEligibilityCell
          subscriptionName={subscription.metadata.name}
          subscriptionNamespace={subscription.metadata.namespace}
        />
      ) : (
        DASH
      ),
    };
  });
