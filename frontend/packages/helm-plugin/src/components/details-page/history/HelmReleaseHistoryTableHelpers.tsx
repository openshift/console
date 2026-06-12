import type { FC, MouseEvent } from 'react';
import { useMemo } from 'react';
import type {
  DataViewTd,
  DataViewTh,
} from '@patternfly/react-data-view/dist/esm/DataViewTable/DataViewTable';
import type { SortByDirection, ThProps } from '@patternfly/react-table';
import { Trans, useTranslation } from 'react-i18next';
import { ActionMenu } from '@console/shared/src/components/actions/menu/ActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { Status } from '@console/shared/src/components/status/Status';
import { DASH } from '@console/shared/src/constants/ui';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import type { HelmRelease } from '../../../types/helm-types';
import { HelmReleaseStatusLabels, releaseStatus } from '../../../utils/helm-utils';
import './HelmReleaseHistoryRow.scss';

type HelmReleaseHistoryKebabProps = {
  obj: HelmRelease;
};

const HelmReleaseHistoryKebab: FC<HelmReleaseHistoryKebabProps> = ({ obj }) => {
  const { t } = useTranslation('helm-plugin');
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
    title: t('Rollback'),
    children: message,
    confirmButtonLabel: t('Rollback'),
    cancelButtonLabel: t('Cancel'),
    onConfirm: () => coFetchJSON.patch('/api/helm/release', payload),
    ouiaId: 'HelmRollbackConfirmation',
  });

  return (
    <ActionMenu
      actions={[
        {
          id: 'helm-rollback-modal-action',
          label: t('Rollback to Revision {{revision}}', { revision }),
          cta: () => openRollbackConfirm(),
        },
      ]}
      className="helm-release-history-action-menu"
    />
  );
};

export const useHelmReleaseHistoryColumns = (
  sortBy: { index: number; direction: SortByDirection },
  onSort: (event: MouseEvent, columnId: string, direction: SortByDirection) => void,
): DataViewTh[] => {
  const { t } = useTranslation('helm-plugin');
  return useMemo(
    () => [
      {
        cell: t('Revision'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 0,
            sortBy: { index: sortBy.index, direction: sortBy.direction },
            onSort: (event, index, direction) => onSort(event, 'revision', direction),
          },
        } as ThProps,
      },
      {
        cell: t('Updated'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 1,
            sortBy: { index: sortBy.index, direction: sortBy.direction },
            onSort: (event, index, direction) => onSort(event, 'updated', direction),
          },
        } as ThProps,
      },
      {
        cell: t('Status'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 2,
            sortBy: { index: sortBy.index, direction: sortBy.direction },
            onSort: (event, index, direction) => onSort(event, 'status', direction),
          },
        } as ThProps,
      },
      {
        cell: t('Chart name'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 3,
            sortBy: { index: sortBy.index, direction: sortBy.direction },
            onSort: (event, index, direction) => onSort(event, 'chartName', direction),
          },
        } as ThProps,
      },
      {
        cell: t('Chart version'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 4,
            sortBy: { index: sortBy.index, direction: sortBy.direction },
            onSort: (event, index, direction) => onSort(event, 'chartVersion', direction),
          },
        } as ThProps,
      },
      {
        cell: t('App version'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 5,
            sortBy: { index: sortBy.index, direction: sortBy.direction },
            onSort: (event, index, direction) => onSort(event, 'appVersion', direction),
          },
        } as ThProps,
      },
      {
        cell: t('Description'),
        props: {
          modifier: 'nowrap',
        } as ThProps,
      },
      {
        cell: '',
        props: {} as ThProps,
      },
    ],
    [t, sortBy, onSort],
  );
};

export const getHelmReleaseHistoryRows = (
  releaseHistory: HelmRelease[],
  totalRevisions: number,
  latestHelmReleaseVersion: number | string,
): DataViewTd[][] => {
  return releaseHistory.map((revision) => {
    return [
      {
        cell: revision.version,
      },
      {
        cell: <Timestamp timestamp={revision.info.last_deployed} />,
      },
      {
        cell: (
          <Status
            status={releaseStatus(revision.info.status)}
            title={HelmReleaseStatusLabels[revision.info.status]}
          />
        ),
      },
      {
        cell: revision.chart.metadata.name,
      },
      {
        cell: revision.chart.metadata.version,
      },
      {
        cell: revision.chart.metadata.appVersion || DASH,
      },
      {
        cell: revision.info.description,
      },
      {
        cell:
          totalRevisions > 1 && latestHelmReleaseVersion !== revision.version ? (
            <HelmReleaseHistoryKebab obj={revision} />
          ) : null,
      },
    ];
  });
};

// Helper function to get column index by ID (matching the history table structure)
export const getHistoryColumnIndexById = (columnId: string): number => {
  const columnMap: Record<string, number> = {
    revision: 0,
    updated: 1,
    status: 2,
    chartName: 3,
    chartVersion: 4,
    appVersion: 5,
    description: 6,
    kebab: 7,
  };
  return columnMap[columnId] ?? 0; // Default to revision column
};
