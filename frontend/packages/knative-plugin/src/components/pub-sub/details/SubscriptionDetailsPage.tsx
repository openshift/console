import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import SubscriptionDetails from './SubscriptionDetails';
import { EventingSubscriptionModel } from '../../../models';
import { useServerlessBreadcrumbsFor } from '../../../hooks/useBreadcrumbsFor';

const SubscriptionDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match } = props;
  const pages = [navFactory.details(SubscriptionDetails), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [
    ...Kebab.getExtensionsActionsForKind(EventingSubscriptionModel),
    ...commonActions,
  ];
  const breadcrumbsFor = useServerlessBreadcrumbsFor(kindObj, match, 'eventing');

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default SubscriptionDetailsPage;
