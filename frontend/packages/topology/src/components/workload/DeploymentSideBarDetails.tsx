import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DeploymentDetailsList } from '@console/internal/components/deployment';
import {
  LoadingBox,
  LoadingInline,
  ResourceSummary,
  WorkloadPausedAlert,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { DeploymentModel } from '@console/internal/models';
import { DeploymentKind } from '@console/internal/module/k8s';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { getResource } from '../../utils';

type DeploymentSideBarDetailsProps = {
  deployment: DeploymentKind;
};

const DeploymentSideBarDetails: React.FC<DeploymentSideBarDetailsProps> = ({ deployment: d }) => {
  const { t } = useTranslation();
  const deploymentClusterResource = {
    kind: d.kind,
    namespace: d.metadata.namespace,
    name: d.metadata.name,
  };
  const [dep, isLoaded] = useK8sWatchResource<DeploymentKind>(deploymentClusterResource);

  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {!isLoaded ? (
        <LoadingBox />
      ) : (
        dep.spec.paused && <WorkloadPausedAlert obj={dep} model={DeploymentModel} />
      )}
      <div className="resource-overview__pod-counts">
        <PodRingSet key={d.metadata.uid} obj={d} path="/spec/replicas" />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary
          isLoaded={isLoaded}
          resource={d}
          newresource={dep}
          showPodSelector
          showNodeSelector
          showTolerations
        >
          <dt>{t('topology~Status')}</dt>
          <dd>
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
          </dd>
        </ResourceSummary>
      </div>
      <div className="resource-overview__details">
        <DeploymentDetailsList deployment={d} />
      </div>
    </div>
  );
};

export const getDeploymentSideBarDetails = (element: GraphElement) => {
  const resource = getResource<DeploymentKind>(element);
  if (!resource || resource.kind !== DeploymentModel.kind) return undefined;
  return <DeploymentSideBarDetails deployment={resource} />;
};
