import * as React from 'react';
import { getBadgeFromType } from '@console/shared';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../models';
import { runFilters } from '../pipelines/detail-page-tabs/PipelineRuns';
import PipelineRunsList from './list-page/PipelineRunList';

interface PipelineRunsResourceListProps {
  showBadge?: boolean;
}

const PipelineRunsResourceList: React.FC<Omit<
  React.ComponentProps<typeof ListPage> & PipelineRunsResourceListProps,
  'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
>> = (props) => {
  const { showBadge = true } = props;
  return (
    <ListPage
      {...props}
      canCreate={false}
      kind={referenceForModel(PipelineRunModel)}
      ListComponent={PipelineRunsList}
      rowFilters={runFilters}
      badge={showBadge ? getBadgeFromType(PipelineRunModel.badge) : null}
    />
  );
};

export default PipelineRunsResourceList;
