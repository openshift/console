import * as React from 'react';
import { ClipboardCopy } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { Conditions } from '@console/internal/components/conditions';
import { DetailsPage } from '@console/internal/components/factory';
import { RoutesDetailsProps } from '@console/internal/components/routes';
import {
  DetailsItem,
  detailsPage,
  ExternalLinkWithCopy,
  navFactory,
  ResourceSummary,
  SectionHeading,
} from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
  useTabbedTableBreadcrumbsFor,
} from '@console/shared';
import { PRIVATE_KNATIVE_SERVING_LABEL } from '../../const';
import { serverlessTab } from '../../utils/serverless-tab-utils';

const RouteDetails: React.FC<RoutesDetailsProps> = ({ obj: route }) => {
  const { t } = useTranslation();
  const isPrivateKSVC =
    route?.metadata?.labels?.[PRIVATE_KNATIVE_SERVING_LABEL] === 'cluster-local';
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('knative-plugin~Route details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={route} />
          </div>
          <div className="col-sm-6">
            <dl>
              <DetailsItem
                label={t('knative-plugin~Location')}
                obj={route}
                path="status.url"
                hideEmpty
              >
                {isPrivateKSVC ? (
                  <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
                    {route?.status?.url}
                  </ClipboardCopy>
                ) : (
                  <ExternalLinkWithCopy
                    link={route?.status?.url}
                    text={route?.status?.url}
                    additionalClassName="co-external-link--block"
                  />
                )}
              </DetailsItem>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('knative-plugin~Conditions')} />
        <Conditions conditions={route?.status?.conditions} />
      </div>
    </>
  );
};

const RouteDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match } = props;
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const pages = [navFactory.details(detailsPage(RouteDetails)), navFactory.editYaml()];
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
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    kindObj,
    match,
    'serving',
    serverlessTab(kindObj.kind),
    undefined,
    isAdminPerspective,
  );

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbs}
      pages={pages}
      customActionMenu={actionMenu}
    />
  );
};

export default RouteDetailsPage;
