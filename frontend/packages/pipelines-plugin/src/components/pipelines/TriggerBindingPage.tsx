import * as React from 'react';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import TriggerBindingDetails from './detail-page-tabs/TriggerBindingDetails';
import { useTriggersBreadcrumbsFor } from './hooks';

const TriggerBindingPage: React.FC<DetailsPageProps> = (props) => {
  const { kind, match } = props;
  const [model] = useK8sModel(kind);
  const breadcrumbsFor = useTriggersBreadcrumbsFor(model, match);

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbsFor}
      menuActions={Kebab.factory.common}
      pages={[navFactory.details(TriggerBindingDetails), navFactory.editYaml()]}
    />
  );
};

export default TriggerBindingPage;
