import * as React from 'react';
import { DefaultList } from '@console/internal/components/default-resource';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterTaskModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';

interface ClusterTaskListPageProps {
  hideBadge?: boolean;
  canCreate?: boolean;
}

const ClusterTaskListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'canCreate' | 'kind' | 'ListComponent'
> &
  ClusterTaskListPageProps> = ({ hideBadge, ...props }) => {
  const badge = usePipelineTechPreviewBadge(props.namespace);
  return (
    <ListPage
      {...props}
      canCreate={props.canCreate ?? true}
      kind={referenceForModel(ClusterTaskModel)}
      ListComponent={DefaultList}
      badge={hideBadge ? null : badge}
    />
  );
};
export default ClusterTaskListPage;
