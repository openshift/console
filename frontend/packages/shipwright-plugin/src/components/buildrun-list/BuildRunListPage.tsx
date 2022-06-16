import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { referenceForModel } from '@console/internal/module/k8s';
import { BuildRunModel } from '../../models';
import { BuildRun, ComputedBuildRunStatus } from '../../types';
import { getBuildRunStatus } from '../buildrun-status/BuildRunStatus';
import { BuildRunTable } from './BuildRunTable';

type ListPageProps = React.ComponentProps<typeof ListPage>;

type BuildRunListPageProps = Omit<ListPageProps, 'title' | 'kind' | 'ListComponent' | 'rowFilters'>;

const BuildRunListPage: React.FC<BuildRunListPageProps> = (props) => {
  const { t } = useTranslation();

  const filters: RowFilter<BuildRun>[] = [
    {
      type: 'status',
      filterGroupName: t('shipwright-plugin~Status'),
      items: [
        { id: ComputedBuildRunStatus.PENDING, title: t('shipwright-plugin~Pending') },
        { id: ComputedBuildRunStatus.RUNNING, title: t('shipwright-plugin~Running') },
        { id: ComputedBuildRunStatus.SUCCEEDED, title: t('shipwright-plugin~Succeeded') },
        { id: ComputedBuildRunStatus.FAILED, title: t('shipwright-plugin~Failed') },
        { id: ComputedBuildRunStatus.UNKNOWN, title: t('shipwright-plugin~Unknown') },
      ],
      reducer: getBuildRunStatus,
      filter: (filterValue, buildRun: BuildRun): boolean => {
        const status = getBuildRunStatus(buildRun);
        return !filterValue.selected?.length || (status && filterValue.selected.includes(status));
      },
    },
  ];

  return (
    <ListPage
      title={t('shipwright-plugin~BuildRuns')}
      kind={referenceForModel(BuildRunModel)}
      ListComponent={BuildRunTable}
      rowFilters={filters}
      canCreate
      {...props}
    />
  );
};

export default BuildRunListPage;
