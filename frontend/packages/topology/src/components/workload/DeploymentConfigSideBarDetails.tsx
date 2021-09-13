import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DeploymentConfigDetailsList } from '@console/internal/components/deployment-config';
import {
  LoadingInline,
  ResourceSummary,
  WorkloadPausedAlert,
} from '@console/internal/components/utils';
import { DeploymentConfigModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { getResource } from '../../utils';

type DeploymentConfigSideBarDetailsProps = {
  dc: K8sResourceKind;
};

const DeploymentConfigSideBarDetails: React.FC<DeploymentConfigSideBarDetailsProps> = ({ dc }) => {
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {dc.spec.paused && <WorkloadPausedAlert obj={dc} model={DeploymentConfigModel} />}
      <div className="resource-overview__pod-counts">
        <PodRingSet key={dc.metadata.uid} obj={dc} path="/spec/replicas" />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={dc} showPodSelector showNodeSelector showTolerations>
          <dt>{t('topology~Status')}</dt>
          <dd>
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
          </dd>
        </ResourceSummary>
      </div>
      <div className="resource-overview__details">
        <DeploymentConfigDetailsList dc={dc} />
      </div>
    </div>
  );
};

export const getDeploymentConfigSideBarDetails = (element: GraphElement) => {
  const resource = getResource(element);
  if (resource.kind !== DeploymentConfigModel.kind) return undefined;
  return <DeploymentConfigSideBarDetails dc={resource} />;
};
