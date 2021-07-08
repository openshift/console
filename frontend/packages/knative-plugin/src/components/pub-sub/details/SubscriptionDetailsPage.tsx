import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { EventingSubscriptionModel } from '../../../models';
import { serverlessTab } from '../../../utils/serverless-tab-utils';
import SubscriptionDetails from './SubscriptionDetails';

const SubscriptionDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match } = props;
  const pages = [navFactory.details(SubscriptionDetails), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [
    ...Kebab.getExtensionsActionsForKind(EventingSubscriptionModel),
    ...commonActions,
  ];
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    kindObj,
    match,
    'eventing',
    serverlessTab(kindObj.kind),
  );

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbs}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default SubscriptionDetailsPage;
