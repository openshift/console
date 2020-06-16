import * as React from 'react';
import { getBadgeFromType } from '@console/shared';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import PipelineResourcesList from './PipelineResourcesList';
import { PipelineResourceModel } from '../../../models';

interface PipelineResourcesListPageProps {
  hideBadge?: boolean;
}

const PipelineResourcesListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage> & PipelineResourcesListPageProps,
  'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
>> = (props) => {
  return (
    <ListPage
      {...props}
      canCreate={false}
      kind={referenceForModel(PipelineResourceModel)}
      ListComponent={PipelineResourcesList}
      badge={props.hideBadge ? null : getBadgeFromType(PipelineResourceModel.badge)}
    />
  );
};

export default PipelineResourcesListPage;
