import type { FC } from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import type { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import type { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { DeploymentConfigDetailsList } from '@console/internal/components/deployment-config';
import {
  LoadingInline,
  ResourceSummary,
  WorkloadPausedAlert,
} from '@console/internal/components/utils';
import { DeploymentConfigModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { getResource } from '../../utils';

type DeploymentConfigSideBarDetailsProps = {
  dc: K8sResourceKind;
};

const DeploymentConfigSideBarDetails: FC<DeploymentConfigSideBarDetailsProps> = ({ dc }) => {
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {dc.spec.paused && <WorkloadPausedAlert obj={dc} model={DeploymentConfigModel} />}
      <div className="resource-overview__pod-counts">
        <PodRingSet key={dc.metadata.uid} obj={dc} path="/spec/replicas" />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={dc} showPodSelector showNodeSelector showTolerations>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('topology~Status')}</DescriptionListTerm>
            <DescriptionListDescription>
              {dc.status.availableReplicas === dc.status.updatedReplicas ? (
                t('topology~Active')
              ) : (
                <div>
                  <span className="co-icon-space-r">
                    <LoadingInline />
                  </span>{' '}
                  {t('topology~Updating')}
                </div>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </ResourceSummary>
      </div>
      <div className="resource-overview__details">
        <DeploymentConfigDetailsList dc={dc} />
      </div>
    </div>
  );
};

export const useDeploymentConfigSideBarDetails: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const resource = getResource(element);
  if (!resource || resource.kind !== DeploymentConfigModel.kind) {
    return [undefined, true, undefined];
  }
  const section = <DeploymentConfigSideBarDetails dc={resource} />;
  return [section, true, undefined];
};
