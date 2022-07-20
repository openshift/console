import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineResourceModel } from '../../../models';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';
import {
  pipelineResourceFilterReducer,
  pipelineResourceTypeFilter,
} from '../../../utils/pipeline-filter-reducer';
import {
  PipelineResourceListFilterId,
  PipelineResourceListFilterLabels,
} from '../../../utils/pipeline-utils';
import PipelineResourcesList from './PipelineResourcesList';

const pipelineResourceFilters = (t: TFunction): RowFilter[] => {
  return [
    {
      filterGroupName: t('pipelines-plugin~Type'),
      type: 'pipelineresource-type',
      reducer: pipelineResourceFilterReducer,
      items: [
        {
          id: PipelineResourceListFilterId.Git,
          title: PipelineResourceListFilterLabels[PipelineResourceListFilterId.Git],
        },
        {
          id: PipelineResourceListFilterId.PullRequest,
          title: PipelineResourceListFilterLabels[PipelineResourceListFilterId.PullRequest],
        },
        {
          id: PipelineResourceListFilterId.Image,
          title: PipelineResourceListFilterLabels[PipelineResourceListFilterId.Image],
        },
        {
          id: PipelineResourceListFilterId.Cluster,
          title: PipelineResourceListFilterLabels[PipelineResourceListFilterId.Cluster],
        },
        {
          id: PipelineResourceListFilterId.Storage,
          title: PipelineResourceListFilterLabels[PipelineResourceListFilterId.Storage],
        },
        {
          id: PipelineResourceListFilterId.CloudEvent,
          title: PipelineResourceListFilterLabels[PipelineResourceListFilterId.CloudEvent],
        },
      ],
      filter: pipelineResourceTypeFilter,
    },
  ];
};

interface PipelineResourcesListPageProps {
  hideBadge?: boolean;
}

const PipelineResourcesListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
> &
  PipelineResourcesListPageProps> = (props) => {
  const { t } = useTranslation();
  const badge = usePipelineTechPreviewBadge(props.namespace);
  return (
    <ListPage
      {...props}
      canCreate={false}
      kind={referenceForModel(PipelineResourceModel)}
      ListComponent={PipelineResourcesList}
      rowFilters={pipelineResourceFilters(t)}
      badge={props.hideBadge ? null : badge}
    />
  );
};

export default PipelineResourcesListPage;
