import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
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

const pipelineResourceFilters = [
  {
    filterGroupName: 'Type',
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

interface PipelineResourcesListPageProps {
  hideBadge?: boolean;
}

const PipelineResourcesListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
> &
  PipelineResourcesListPageProps> = (props) => {
  const badge = usePipelineTechPreviewBadge(props.namespace);
  return (
    <ListPage
      {...props}
      canCreate={false}
      kind={referenceForModel(PipelineResourceModel)}
      ListComponent={PipelineResourcesList}
      rowFilters={pipelineResourceFilters}
      badge={props.hideBadge ? null : badge}
    />
  );
};

export default PipelineResourcesListPage;
