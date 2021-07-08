import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { runFilters } from '../pipelines/detail-page-tabs/PipelineRuns';
import PipelineRunsList from './list-page/PipelineRunList';

interface PipelineRunsResourceListProps {
  hideBadge?: boolean;
  canCreate?: boolean;
}

const PipelineRunsResourceList: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'kind' | 'ListComponent' | 'rowFilters'
> &
  PipelineRunsResourceListProps> = (props) => {
  const badge = usePipelineTechPreviewBadge(props.namespace);
  return (
    <ListPage
      {...props}
      canCreate={props.canCreate ?? true}
      kind={referenceForModel(PipelineRunModel)}
      ListComponent={PipelineRunsList}
      rowFilters={runFilters}
      badge={props.hideBadge ? null : badge}
    />
  );
};

export default PipelineRunsResourceList;
