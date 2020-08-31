import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import TriggerBindingDetails from './detail-page-tabs/TriggerBindingDetails';
import { useTriggersBreadcrumbsFor } from './hooks';

const TriggerBindingPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj, match);

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
