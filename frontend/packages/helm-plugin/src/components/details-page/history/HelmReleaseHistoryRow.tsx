import { Trans, useTranslation } from 'react-i18next';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { coFetchJSON } from '@console/internal/co-fetch';
import { ActionMenu, Status, DASH } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { HelmRelease } from '../../../types/helm-types';
import { HelmReleaseStatusLabels, releaseStatus } from '../../../utils/helm-utils';
import { tableColumnInfo } from './HelmReleaseHistoryHeader';

type HelmReleaseHistoryKebabProps = {
  obj: HelmRelease;
};

const HelmReleaseHistoryKebab = ({ obj }: HelmReleaseHistoryKebabProps) => {
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
    />
  );
};

type HelmReleaseHistoryCustomData = {
  totalRevisions: number;
  latestHelmReleaseVersion: number;
};

export const getDataViewRows: GetDataViewRows<HelmRelease, HelmReleaseHistoryCustomData> = (
  data,
  columns,
) => {
  return data.map(({ obj: revision, rowData }) => {
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: revision.version,
      },
      [tableColumnInfo[1].id]: {
        cell: <Timestamp timestamp={revision.info.last_deployed} />,
      },
      [tableColumnInfo[2].id]: {
        cell: (
          <Status
            status={releaseStatus(revision.info.status)}
            title={HelmReleaseStatusLabels[revision.info.status]}
          />
        ),
      },
      [tableColumnInfo[3].id]: {
        cell: revision.chart.metadata.name,
      },
      [tableColumnInfo[4].id]: {
        cell: revision.chart.metadata.version,
      },
      [tableColumnInfo[5].id]: {
        cell: revision.chart.metadata.appVersion || DASH,
      },
      [tableColumnInfo[6].id]: {
        cell: revision.info.description,
      },
      [tableColumnInfo[7].id]: {
        cell:
          rowData?.totalRevisions > 1 && rowData?.latestHelmReleaseVersion !== revision.version ? (
            <HelmReleaseHistoryKebab obj={revision} />
          ) : null,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        cell,
      };
    });
  });
};

export default getDataViewRows;
