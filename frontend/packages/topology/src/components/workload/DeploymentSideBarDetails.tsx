import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DeploymentDetailsList } from '@console/internal/components/deployment';
import {
  LoadingInline,
  ResourceSummary,
  WorkloadPausedAlert,
} from '@console/internal/components/utils';
import { DeploymentModel } from '@console/internal/models';
import { DeploymentKind } from '@console/internal/module/k8s';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { getResource } from '../../utils';

type DeploymentSideBarDetailsProps = {
  deployment: DeploymentKind;
};

const DeploymentSideBarDetails: React.FC<DeploymentSideBarDetailsProps> = ({ deployment: d }) => {
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {d.spec.paused && <WorkloadPausedAlert obj={d} model={DeploymentModel} />}
      <div className="resource-overview__pod-counts">
        <PodRingSet key={d.metadata.uid} obj={d} path="/spec/replicas" />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={d} showPodSelector showNodeSelector showTolerations>
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
