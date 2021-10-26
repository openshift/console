import * as React from 'react';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import ClusterTaskDetails from './ClusterTaskDetails';

const ClusterTaskDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kind, match } = props;
  const [model] = useK8sModel(kind);
  const breadcrumbsFor = useTasksBreadcrumbsFor(model, match);
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
