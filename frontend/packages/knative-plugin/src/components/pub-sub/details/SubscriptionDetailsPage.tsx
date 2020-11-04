import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import SubscriptionDetails from './SubscriptionDetails';
import { EventingSubscriptionModel } from '../../../models';

const SubscriptionDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const pages = [navFactory.details(SubscriptionDetails), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [
    ...Kebab.getExtensionsActionsForKind(EventingSubscriptionModel),
    ...commonActions,
  ];

  return <DetailsPage {...props} pages={pages} menuActions={menuActionsCreator} />;
};

export default SubscriptionDetailsPage;
