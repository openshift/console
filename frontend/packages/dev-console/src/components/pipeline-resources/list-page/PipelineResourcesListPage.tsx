import * as React from 'react';
import { getBadgeFromType } from '@console/shared';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import PipelineResourcesList from './PipelineResourcesList';
import { PipelineResourceModel } from '../../../models';

interface PipelineResourcesListPageProps {
  showBadge?: boolean;
}

const PipelineResourcesListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage> & PipelineResourcesListPageProps,
  'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
>> = (props) => {
  const { showBadge = true } = props;
  return (
    <ListPage
      {...props}
      canCreate={false}
      kind={referenceForModel(PipelineResourceModel)}
      ListComponent={PipelineResourcesList}
      badge={showBadge ? getBadgeFromType(PipelineResourceModel.badge) : null}
    />
  );
};

export default PipelineResourcesListPage;
