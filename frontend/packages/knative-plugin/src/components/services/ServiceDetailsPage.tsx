import * as React from 'react';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel, K8sKind } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
  useTabbedTableBreadcrumbsFor,
} from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { isServerlessFunction } from '../../topology/knative-topology-utils';
import { serverlessTab } from '../../utils/serverless-tab-utils';
import ServerlessFunctionType from '../overview/ServerlessFunctionType';

const ServiceDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { match, kind } = props;
  const [model] = useK8sModel(kind);

  const renderTypeForServerlessFunction = (obj: K8sResourceKind) =>
    isServerlessFunction(obj) ? <ServerlessFunctionType /> : null;
  const pages = [
    navFactory.details(DetailsForKind(kind, renderTypeForServerlessFunction)),
    navFactory.editYaml(),
  ];
  const actionMenu = (kindObjData: K8sKind, obj: K8sResourceKind) => {
    const resourceKind = referenceForModel(kindObjData);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };
  const breadcrumbs = useTabbedTableBreadcrumbsFor(model, match, 'serving', serverlessTab(kind));
  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbs}
      pages={pages}
      customActionMenu={actionMenu}
    />
  );
};

export default ServiceDetailsPage;
