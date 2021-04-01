import * as React from 'react';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import ClusterTaskDetails from './ClusterTaskDetails';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';

const ClusterTaskDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj, match);
  const badge = usePipelineTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      menuActions={Kebab.factory.common}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(ClusterTaskDetails), navFactory.editYaml()]}
    />
  );
};

export default ClusterTaskDetailsPage;
