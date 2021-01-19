import * as React from 'react';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { DetailsPage } from '@console/internal/components/factory';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { EventingBrokerModel } from '../../../models';
import { useServerlessBreadcrumbsFor } from '../../../hooks/useBreadcrumbsFor';

const BrokerDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match, kind } = props;
  const pages = [navFactory.details(DetailsForKind(kind)), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [
    ...Kebab.getExtensionsActionsForKind(EventingBrokerModel),
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

export default BrokerDetailsPage;
