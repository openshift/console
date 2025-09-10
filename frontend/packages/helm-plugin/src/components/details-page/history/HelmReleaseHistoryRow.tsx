import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { coFetchJSON } from '@console/internal/co-fetch';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { ActionMenu, Status } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { HelmRelease } from '../../../types/helm-types';
import { HelmReleaseStatusLabels, releaseStatus } from '../../../utils/helm-utils';
import { tableColumnClasses } from './HelmReleaseHistoryHeader';
import './HelmReleaseHistoryRow.scss';

type HelmReleaseHistoryKebabProps = {
  obj: HelmRelease;
};

const HelmReleaseHistoryKebab: React.FC<HelmReleaseHistoryKebabProps> = ({ obj }) => {
  const { t } = useTranslation();
  const message = (
    <Trans t={t} ns="helm-plugin">
      Are you sure you want to rollback <strong>{{ releaseName: obj.name }}</strong> to{' '}
      <strong>Revision {{ revision: obj.version }}</strong>?
    </Trans>
  );
  const payload = {
    namespace: obj.namespace,
    name: obj.name,
    version: obj.version,
  };
  const revision = obj.version;

  const openRollbackConfirm = useWarningModal({
    title: t('helm-plugin~Rollback'),
    children: message,
    confirmButtonLabel: t('helm-plugin~Rollback'),
    cancelButtonLabel: t('public~Cancel'),
    onConfirm: () => coFetchJSON.patch('/api/helm/release', payload),
    ouiaId: 'HelmRollbackConfirmation',
  });

  return (
    <ActionMenu
      actions={[
        {
          id: 'helm-rollback-modal-action',
          label: t('helm-plugin~Rollback to Revision {{revision}}', { revision }),
          cta: () => openRollbackConfirm(),
        },
      ]}
      className="helm-release-history-action-menu"
    />
  );
};

const HelmReleaseHistoryRow: React.FC<RowFunctionArgs> = ({ obj, customData }) => (
  <>
    <TableData className={tableColumnClasses.revision}>{obj.version}</TableData>
    <TableData className={tableColumnClasses.updated}>
      <Timestamp timestamp={obj.info.last_deployed} />
    </TableData>
    <TableData className={tableColumnClasses.status}>
      <Status
        status={releaseStatus(obj.info.status)}
        title={HelmReleaseStatusLabels[obj.info.status]}
      />
    </TableData>
    <TableData className={tableColumnClasses.chartName}>{obj.chart.metadata.name}</TableData>
    <TableData className={tableColumnClasses.chartVersion}>{obj.chart.metadata.version}</TableData>
    <TableData className={tableColumnClasses.appVersion}>{obj.chart.metadata.appVersion}</TableData>
    <TableData className={tableColumnClasses.description}>{obj.info.description}</TableData>
    <TableData className={tableColumnClasses.kebab}>
      {customData?.totalRevisions > 1 && customData?.latestHelmReleaseVersion !== obj.version && (
        <HelmReleaseHistoryKebab obj={obj} />
      )}
    </TableData>
  </>
);

export default HelmReleaseHistoryRow;
