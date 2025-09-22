import * as React from 'react';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { ClusterTaskModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import ClusterTaskDetails from './ClusterTaskDetails';

const ClusterTaskDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj);
  const badge = usePipelineTechPreviewBadge(props.namespace);
  const commonActions = useCommonResourceActions(ClusterTaskModel, props.obj);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      menuActions={commonActions}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(ClusterTaskDetails), navFactory.editYaml()]}
    />
  );
};

export default ClusterTaskDetailsPage;
