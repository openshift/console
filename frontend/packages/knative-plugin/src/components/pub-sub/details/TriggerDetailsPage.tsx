import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { EventingTriggerModel } from '../../../models';
import { serverlessTab } from '../../../utils/serverless-tab-utils';
import TriggerDetails from './TriggerDetails';

const TriggerDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    kindObj,
    match,
    'eventing',
    serverlessTab(kindObj.kind),
  );
  const pages = [navFactory.details(TriggerDetails), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [
    ...Kebab.getExtensionsActionsForKind(EventingTriggerModel),
    ...commonActions,
  ];

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbs}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default TriggerDetailsPage;
