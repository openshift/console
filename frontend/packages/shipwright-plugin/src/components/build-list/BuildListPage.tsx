import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFlag } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ListPage, ListPageProps } from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { referenceForModel } from '@console/internal/module/k8s';
import { BuildModel, BuildModelV1Alpha1 } from '../../models';
import { Build } from '../../types';
import { getBuildRunStatus } from '../buildrun-status/BuildRunStatus';
import { BuildTable } from './BuildTable';

type BuildListPageProps = Omit<
  ListPageProps,
  'title' | 'badge' | 'kind' | 'ListComponent' | 'rowFilters'
>;

const getBuildStatus = (build: Build): string => {
  if (build.latestBuild) {
    return getBuildRunStatus(build.latestBuild);
  }
  return 'Unknown';
};

const BuildListPage: React.FC<BuildListPageProps> = (props) => {
  const { t } = useTranslation();

  const filters: RowFilter<Build>[] = [
    {
      type: 'status',
      filterGroupName: t('shipwright-plugin~BuildRun status'),
      items: [
        { id: 'Pending', title: t('shipwright-plugin~Pending') },
        { id: 'Running', title: t('shipwright-plugin~Running') },
        { id: 'Succeeded', title: t('shipwright-plugin~Succeeded') },
        { id: 'Failed', title: t('shipwright-plugin~Failed') },
        { id: 'Unknown', title: t('shipwright-plugin~Unknown') },
      ],
      reducer: getBuildStatus,
      filter: (filterValue, build: Build): boolean => {
        const status = getBuildRunStatus(build.latestBuild);
        return !filterValue.selected?.length || (status && filterValue.selected.includes(status));
      },
    },
  ];

  return (
    <ListPage
      title={t('shipwright-plugin~Builds')}
      kind={
        useFlag('SHIPWRIGHT_BUILD')
          ? referenceForModel(BuildModel)
          : referenceForModel(BuildModelV1Alpha1)
      }
      ListComponent={BuildTable}
      rowFilters={filters}
      canCreate
      {...props}
    />
  );
};

export default BuildListPage;
