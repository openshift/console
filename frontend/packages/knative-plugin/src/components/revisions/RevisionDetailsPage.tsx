import type { ComponentProps, FC } from 'react';
import { useParams, useLocation } from 'react-router';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { ActionMenuVariant, ActionServiceProvider, ActionMenu } from '@console/shared';
import { useTabbedTableBreadcrumbsFor } from '@console/shared/src/hooks/useTabbedTableBreadcrumb';
import { serverlessTab } from '../../utils/serverless-tab-utils';

const RevisionDetailsPage: FC<ComponentProps<typeof DetailsPage>> = (props) => {
  const location = useLocation();
  const params = useParams();
  const { kindObj } = props;
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const pages = [navFactory.details(DetailsForKind), navFactory.editYaml()];
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    kindObj,
    location,
    params,
    'serving',
    serverlessTab(kindObj.kind),
    undefined,
    isAdminPerspective,
  );

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

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbs}
      pages={pages}
      customActionMenu={actionMenu}
    />
  );
};

export default RevisionDetailsPage;
