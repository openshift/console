import type { MouseEvent } from 'react';
import { useMemo } from 'react';
import { DataViewTd, DataViewTh } from '@patternfly/react-data-view';
import { SortByDirection, ThProps } from '@patternfly/react-table';
import { Trans, useTranslation } from 'react-i18next';
import { coFetchJSON } from '@console/internal/co-fetch';
import { ActionMenu, Status, DASH } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { HelmRelease } from '../../../types/helm-types';
import { HelmReleaseStatusLabels, releaseStatus } from '../../../utils/helm-utils';
import './HelmReleaseHistoryRow.scss';

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
      className="helm-release-history-action-menu"
    />
  );
};

export const useHelmReleaseHistoryColumns = (
  sortBy: { index: number; direction: SortByDirection },
  onSort: (event: MouseEvent, columnId: string, direction: SortByDirection) => void,
): DataViewTh[] => {
  const { t } = useTranslation();
  return useMemo(
    () => [
      {
        cell: t('helm-plugin~Revision'),
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
        cell: t('helm-plugin~Updated'),
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
        cell: t('helm-plugin~Status'),
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
        cell: t('helm-plugin~Chart name'),
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
        cell: t('helm-plugin~Chart version'),
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
        cell: t('helm-plugin~App version'),
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
        cell: t('helm-plugin~Description'),
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
