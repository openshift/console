import * as React from 'react';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  ActionMenuVariant,
  ActionServiceProvider,
  useTabbedTableBreadcrumbsFor,
  ActionMenu,
} from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { serverlessTab } from '../../utils/serverless-tab-utils';

const RevisionDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { match, kind } = props;
  const [model] = useK8sModel(kind);
  const pages = [navFactory.details(DetailsForKind(kind)), navFactory.editYaml()];
  const breadcrumbs = useTabbedTableBreadcrumbsFor(model, match, 'serving', serverlessTab(kind));

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
