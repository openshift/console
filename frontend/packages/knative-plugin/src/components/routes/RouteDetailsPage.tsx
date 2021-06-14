import * as React from 'react';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { RouteModel } from '../../models';
import { serverlessTab } from '../../utils/serverless-tab-utils';

const RouteDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match, kind } = props;
  const pages = [navFactory.details(DetailsForKind(kind)), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [...Kebab.getExtensionsActionsForKind(RouteModel), ...commonActions];
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    kindObj,
    match,
    'serving',
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

export default RouteDetailsPage;
