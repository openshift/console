import * as React from 'react';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { DetailsPage } from '@console/internal/components/factory';

import { DetailsForKind } from '@console/internal/components/default-resource';
import { useServingBreadcrumbsFor } from './hooks';
import { ServiceModel } from '../../models';

const ServiceDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbsFor = useServingBreadcrumbsFor(kindObj, match);
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [...Kebab.getExtensionsActionsForKind(ServiceModel), ...commonActions];

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default ServiceDetailsPage;
