import * as React from 'react';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { DetailsPage } from '@console/internal/components/factory';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { RouteModel } from '../../models';

const RouteDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [...Kebab.getExtensionsActionsForKind(RouteModel), ...commonActions];

  return <DetailsPage {...props} pages={pages} menuActions={menuActionsCreator} />;
};

export default RouteDetailsPage;
