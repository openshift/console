import * as React from 'react';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { K8sModel, referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
  useTabbedTableBreadcrumbsFor,
} from '@console/shared';
import { serverlessTab } from '../../../utils/serverless-tab-utils';
import TriggerDetails from './TriggerDetails';

const TriggerDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj } = props;
  const params = useParams() as any;
  const location = useLocation();
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const customActionMenu = (kindObjData: K8sModel, obj: K8sResourceKind) => {
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
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    kindObj ?? ({} as K8sModel),
    location,
    params,
    'eventing',
    serverlessTab(kindObj?.kind ?? '') || undefined,
    undefined,
    isAdminPerspective,
  );
  const pages = [navFactory.details(TriggerDetails), navFactory.editYaml()];

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() =>
        (breadcrumbs ?? []).filter((b) => b.name).map((b) => ({ ...b, name: b.name ?? '' }))
      }
      pages={pages ?? []}
      customActionMenu={customActionMenu}
    />
  );
};

export default TriggerDetailsPage;
