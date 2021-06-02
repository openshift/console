import * as React from 'react';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { ServiceModel } from '../../models';
import { isServerlessFunction } from '../../topology/knative-topology-utils';
import { serverlessTab } from '../../utils/serverless-tab-utils';
import ServerlessFunctionType from '../overview/ServerlessFunctionType';

const ServiceDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match, kind } = props;
  const renderTypeForServerlessFunction = (obj: K8sResourceKind) =>
    isServerlessFunction(obj) ? <ServerlessFunctionType /> : null;
  const pages = [
    navFactory.details(DetailsForKind(kind, renderTypeForServerlessFunction)),
    navFactory.editYaml(),
  ];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [...Kebab.getExtensionsActionsForKind(ServiceModel), ...commonActions];
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

export default ServiceDetailsPage;
