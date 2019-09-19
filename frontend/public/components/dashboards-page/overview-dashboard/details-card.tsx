import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { getInfrastructurePlatform } from '@console/shared';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '../../dashboard/dashboard-card';
import { DetailsBody, DetailItem } from '../../dashboard/details-card';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { InfrastructureModel, ClusterVersionModel } from '../../../models';
import { referenceForModel, K8sResourceKind, getOpenShiftVersion, getK8sGitVersion, ClusterVersionKind, getClusterID } from '../../../module/k8s';
import { FLAGS } from '../../../const';
import { flagPending, featureReducerName } from '../../../reducers/features';
import { FirehoseResource } from '../../utils';
import { RootState } from '../../../redux';

const clusterVersionResource: FirehoseResource = {
  kind: referenceForModel(ClusterVersionModel),
  namespaced: false,
  name: 'version',
  isList: false,
  prop: 'cv',
};

const infrastructureResource: FirehoseResource = {
  kind: referenceForModel(InfrastructureModel),
  namespaced: false,
  name: 'cluster',
  isList: false,
  prop: 'infrastructure',
};

const mapStateToProps = (state: RootState) => ({
  openshiftFlag: state[featureReducerName].get(FLAGS.OPENSHIFT),
});

export const DetailsCard_ = connect(mapStateToProps)(({
  watchURL,
  stopWatchURL,
  watchK8sResource,
  stopWatchK8sResource,
  resources,
  urlResults,
  openshiftFlag,
}: DetailsCardProps) => {
  React.useEffect(() => {
    if (flagPending(openshiftFlag)) {
      return;
    }
    if (openshiftFlag) {
      watchK8sResource(clusterVersionResource);
      watchK8sResource(infrastructureResource);
      return () => {
        stopWatchK8sResource(clusterVersionResource);
        stopWatchK8sResource(infrastructureResource);
      };
    }
    watchURL('version');
    return () => {
      stopWatchURL('version');
    };
  }, [openshiftFlag, watchK8sResource, stopWatchK8sResource, watchURL, stopWatchURL]);

  const clusterVersionLoaded = _.get(resources.cv, 'loaded', false);
  const clusterVersionError = _.get(resources.cv, 'loadError');
  const clusterVersionData = _.get(resources.cv, 'data') as ClusterVersionKind;
  const clusterId = getClusterID(clusterVersionData);
  const openShiftVersion = getOpenShiftVersion(clusterVersionData);

  const infrastructureLoaded = _.get(resources.infrastructure, 'loaded', false);
  const infrastructureError = _.get(resources.infrastructure, 'loadError');
  const infrastructureData = _.get(resources.infrastructure, 'data') as K8sResourceKind;
  const infrastructurePlatform = getInfrastructurePlatform(infrastructureData);

  const kubernetesVersionData = urlResults.getIn(['version', 'data']);
  const kubernetesVersionError = urlResults.getIn(['version', 'loadError']);
  const k8sGitVersion = getK8sGitVersion(kubernetesVersionData);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={flagPending(openshiftFlag)}>
        <DetailsBody>
          {openshiftFlag ? (
            <>
              <DetailItem
                key="clusterid"
                title="Cluster ID"
                error={!!clusterVersionError || (clusterVersionLoaded && !clusterId)}
                isLoading={!clusterVersionLoaded}
              >
                {clusterId}
              </DetailItem>
              <DetailItem
                key="provider"
                title="Provider"
                error={!!infrastructureError || (infrastructureLoaded && !infrastructurePlatform)}
                isLoading={!infrastructureLoaded}
              >
                {infrastructurePlatform}
              </DetailItem>
              <DetailItem
                key="openshift"
                title="OpenShift version"
                error={!!clusterVersionError || (clusterVersionLoaded && !openShiftVersion)}
                isLoading={!clusterVersionLoaded}
              >
                {openShiftVersion}
              </DetailItem>
            </>
          ) : (
            <DetailItem
              key="kubernetes"
              title="Kubernetes version"
              error={kubernetesVersionError || (kubernetesVersionData && !k8sGitVersion)}
              isLoading={!kubernetesVersionData}
            >
              {k8sGitVersion}
            </DetailItem>
          )}
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
});

export const DetailsCard = withDashboardResources(DetailsCard_);

type DetailsCardProps = DashboardItemProps & {
  openshiftFlag: boolean;
}
