import * as React from 'react';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
  useTabbedTableBreadcrumbsFor,
} from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { serverlessTab } from '../../../utils/serverless-tab-utils';
import TriggerDetails from './TriggerDetails';

const TriggerDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kind, match } = props;

  const [model] = useK8sModel(kind);

  const customActionMenu = (kindObjData, obj) => {
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
  const breadcrumbs = useTabbedTableBreadcrumbsFor(model, match, 'eventing', serverlessTab(kind));
  const pages = [navFactory.details(TriggerDetails), navFactory.editYaml()];

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbs}
      pages={pages}
      customActionMenu={customActionMenu}
    />
  );
};

export default TriggerDetailsPage;
