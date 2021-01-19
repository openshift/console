import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import TriggerDetails from './TriggerDetails';
import { EventingTriggerModel } from '../../../models';
import { useServerlessBreadcrumbsFor } from '../../../hooks/useBreadcrumbsFor';

const TriggerDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbsFor = useServerlessBreadcrumbsFor(kindObj, match, 'eventing');
  const pages = [navFactory.details(TriggerDetails), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [
    ...Kebab.getExtensionsActionsForKind(EventingTriggerModel),
    ...commonActions,
  ];

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default TriggerDetailsPage;
