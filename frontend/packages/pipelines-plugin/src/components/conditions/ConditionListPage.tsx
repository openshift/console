import * as React from 'react';
import { DefaultList } from '@console/internal/components/default-resource';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { ConditionModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';

interface ConditionListPageProps {
  hideBadge?: boolean;
  canCreate?: boolean;
}

const ConditionListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'canCreate' | 'kind' | 'ListComponent'
> &
  ConditionListPageProps> = ({ hideBadge, ...props }) => {
  const badge = usePipelineTechPreviewBadge(props.namespace);
  return (
    <ListPage
      {...props}
      canCreate={props.canCreate ?? true}
      kind={referenceForModel(ConditionModel)}
      ListComponent={DefaultList}
      badge={hideBadge ? null : badge}
    />
  );
};
export default ConditionListPage;
