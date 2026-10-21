import type { FC } from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import type { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import type { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { DeploymentDetailsList } from '@console/internal/components/deployment';
import {
  LoadingInline,
  ResourceSummary,
  WorkloadPausedAlert,
} from '@console/internal/components/utils';
import { DeploymentModel } from '@console/internal/models';
import type { DeploymentKind } from '@console/internal/module/k8s';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { getResource } from '../../utils';

type DeploymentSideBarDetailsProps = {
  deployment: DeploymentKind;
};

const DeploymentSideBarDetails: FC<DeploymentSideBarDetailsProps> = ({ deployment: d }) => {
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {d.spec.paused && <WorkloadPausedAlert obj={d} model={DeploymentModel} />}
      <div className="resource-overview__pod-counts">
        <PodRingSet key={d.metadata.uid} obj={d} path="/spec/replicas" />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={d} showPodSelector showNodeSelector showTolerations>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('topology~Status')}</DescriptionListTerm>
            <DescriptionListDescription>
              {d.status.availableReplicas === d.status.updatedReplicas ? (
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
        <DeploymentDetailsList deployment={d} />
      </div>
    </div>
  );
};

export const useDeploymentSideBarDetails: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const resource = getResource<DeploymentKind>(element);
  if (!resource || resource.kind !== DeploymentModel.kind) {
    return [undefined, true, undefined];
  }
  const section = <DeploymentSideBarDetails deployment={resource} />;
  return [section, true, undefined];
};
