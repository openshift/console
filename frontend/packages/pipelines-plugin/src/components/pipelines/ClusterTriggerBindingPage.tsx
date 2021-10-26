import * as React from 'react';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useTriggersBreadcrumbsFor } from './hooks';

const ClusterTriggerBindingPage: React.FC<DetailsPageProps> = (props) => {
  const { match, kind } = props;

  const [model] = useK8sModel(kind);
  const breadcrumbsFor = useTriggersBreadcrumbsFor(model, match);

  return (
    <DetailsPage
      {...props}
      menuActions={Kebab.factory.common}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(DetailsForKind(kind)), navFactory.editYaml()]}
    />
  );
};

export default ClusterTriggerBindingPage;
