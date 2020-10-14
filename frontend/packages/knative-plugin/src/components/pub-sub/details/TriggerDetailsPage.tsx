import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import TriggerDetails from './TriggerDetails';
import { EventingTriggerModel } from '../../../models';

const TriggerDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const pages = [navFactory.details(TriggerDetails), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [
    ...Kebab.getExtensionsActionsForKind(EventingTriggerModel),
    ...commonActions,
  ];

  return <DetailsPage {...props} pages={pages} menuActions={menuActionsCreator} />;
};

export default TriggerDetailsPage;
