import * as React from 'react';
import { ClipboardCopy, DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { Conditions } from '@console/internal/components/conditions';
import { DetailsPage } from '@console/internal/components/factory';
import {
  DetailsItem,
  detailsPage,
  ExternalLinkWithCopy,
  navFactory,
  ResourceSummary,
  SectionHeading,
} from '@console/internal/components/utils';
import {
  K8sKind,
  K8sResourceKind,
  referenceForModel,
  RouteKind,
} from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
  useTabbedTableBreadcrumbsFor,
} from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { PRIVATE_KNATIVE_SERVING_LABEL } from '../../const';
import { serverlessTab } from '../../utils/serverless-tab-utils';

const RouteDetails: React.FC<RoutesDetailsProps> = ({ obj: route }) => {
  const { t } = useTranslation();
  const isPrivateKSVC =
    route?.metadata?.labels?.[PRIVATE_KNATIVE_SERVING_LABEL] === 'cluster-local';
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('knative-plugin~Route details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={route} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
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
                    href={route?.status?.url}
                    text={route?.status?.url}
                    displayBlock
                  />
                )}
              </DetailsItem>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('knative-plugin~Conditions')} />
        <Conditions conditions={route?.status?.conditions} />
      </PaneBody>
    </>
  );
};

const RouteDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj } = props;
  const params = useParams();
  const location = useLocation();
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
    location,
    params,
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

type RoutesDetailsProps = {
  obj: RouteKind;
};
