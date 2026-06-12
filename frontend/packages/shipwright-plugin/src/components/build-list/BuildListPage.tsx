import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { ListPageProps } from '@console/internal/components/factory';
import { ListPage } from '@console/internal/components/factory';
import type { RowFilter } from '@console/internal/components/filter-toolbar';
import { referenceForModel } from '@console/internal/module/k8s';
import type { Build } from '../../types';
import { useBuildModel } from '../../utils';
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

const BuildListPage: FC<BuildListPageProps> = (props) => {
  const { t } = useTranslation('shipwright-plugin');

  const filters: RowFilter<Build>[] = [
    {
      type: 'status',
      filterGroupName: t('BuildRun status'),
      items: [
        { id: 'Pending', title: t('Pending') },
        { id: 'Running', title: t('Running') },
        { id: 'Succeeded', title: t('Succeeded') },
        { id: 'Failed', title: t('Failed') },
        { id: 'Unknown', title: t('Unknown') },
      ],
      reducer: getBuildStatus,
      filter: (filterValue, build: Build): boolean => {
        const status = getBuildRunStatus(build.latestBuild);
        return !filterValue.selected?.length || (status && filterValue.selected.includes(status));
      },
    },
  ];

  const buildModel = useBuildModel();

  return (
    <ListPage
      title={t('Builds')}
      kind={referenceForModel(buildModel)}
      ListComponent={BuildTable}
      rowFilters={filters}
      canCreate
      createProps={{
        to: props.namespace
          ? `/k8s/ns/${props.namespace}/${referenceForModel(buildModel)}/~new/form`
          : `/k8s/cluster/${referenceForModel(buildModel)}/~new`,
      }}
      {...props}
    />
  );
};

export default BuildListPage;
