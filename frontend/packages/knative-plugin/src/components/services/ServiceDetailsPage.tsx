import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { Conditions } from '@console/internal/components/conditions';
import { DetailsPage } from '@console/internal/components/factory';
import {
  ContainerTable,
  DetailsItem,
  ExternalLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel, K8sKind } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
  useTabbedTableBreadcrumbsFor,
} from '@console/shared';
import { RevisionModel } from '../../models';
import { isServerlessFunction } from '../../topology/knative-topology-utils';
import { RevisionKind, ServiceKind, ServiceTypeValue } from '../../types';
import { serverlessTab } from '../../utils/serverless-tab-utils';
import { KnativeServiceTypeContext } from '../functions/ServiceTypeContext';
import RevisionsOverviewList from '../overview/RevisionsOverviewList';

const ServiceDetails: React.FC<{ obj: ServiceKind }> = ({ obj }) => {
  const { t } = useTranslation();
  const [revisions, revisionLoaded, revisionErrorLoad] = useK8sWatchResource<RevisionKind[]>({
    kind: referenceForModel(RevisionModel),
    namespace: obj.metadata.namespace,
    isList: true,
  });

  const revisionsForService =
    revisionLoaded &&
    !revisionErrorLoad &&
    revisions.filter(
      (revision) =>
        _.get(revision.metadata, `labels["serving.knative.dev/service"]`) === obj.metadata.name,
    );
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('knative-plugin~Service details')} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary
              resource={obj}
              podSelector="spec.podSelector"
              showNodeSelector={false}
            />
          </div>
          <div className="col-md-6">
            {isServerlessFunction(obj) && (
              <DetailsItem label={t('knative-plugin~Type')} obj={obj}>
                {t('knative-plugin~Function')}
              </DetailsItem>
            )}
            {obj?.status?.url && (
              <DetailsItem label={t('knative-plugin~URL')} obj={obj} path="status.url">
                <ExternalLink
                  href={obj.status.url}
                  additionalClassName="co-external-link--block"
                  text={obj.status.url}
                />
              </DetailsItem>
            )}
            {revisionsForService && revisionLoaded && !revisionErrorLoad && (
              <DetailsItem label={t('knative-plugin~Revisions')} obj={obj} path="status.traffic">
                <RevisionsOverviewList
                  revisions={revisionsForService}
                  service={obj}
                  hideSectionHeading
                />
              </DetailsItem>
            )}
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('knative-plugin~Containers')} />
        <ContainerTable containers={obj.spec.template.spec.containers} />
      </div>
      {_.isArray(obj?.status?.conditions) && (
        <div className="co-m-pane__body">
          <SectionHeading text={t('knative-plugin~Conditions')} />
          <Conditions conditions={obj.status.conditions} />
        </div>
      )}
    </>
  );
};

const ServiceDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { t } = useTranslation();
  const serviceTypeValue = React.useContext(KnativeServiceTypeContext);
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const { kindObj, match } = props;
  const pages = [navFactory.details(ServiceDetails), navFactory.editYaml()];
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
    serviceTypeValue === ServiceTypeValue.Functions ? 'functions' : 'serving',
    serverlessTab(kindObj.kind),
    serviceTypeValue === ServiceTypeValue.Functions ? t('knative-plugin~Functions') : undefined,
    serviceTypeValue === ServiceTypeValue.Functions ? true : isAdminPerspective,
    serviceTypeValue === ServiceTypeValue.Functions ? t('knative-plugin~Function') : undefined,
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

export default ServiceDetailsPage;
