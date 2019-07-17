import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '../../dashboard/dashboard-card';
import { DetailsBody, DetailItem } from '../../dashboard/details-card';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { InfrastructureModel, ClusterVersionModel } from '../../../models';
import { referenceForModel, K8sResourceKind, getOpenShiftVersion, getK8sGitVersion, getClusterName, ClusterVersionKind } from '../../../module/k8s';
import { FLAGS } from '../../../const';
import { flagPending, featureReducerName } from '../../../reducers/features';
import { FirehoseResource } from '../../utils';
import { RootState } from '../../../redux';

const getInfrastructurePlatform = (infrastructure: K8sResourceKind): string => _.get(infrastructure, 'status.platform');

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
  const openshiftVersion = getOpenShiftVersion(_.get(resources.cv, 'data') as ClusterVersionKind);

  const infrastructureLoaded = _.get(resources.infrastructure, 'loaded', false);
  const infrastructureError = _.get(resources.infrastructure, 'loadError');
  const infrastructureData = _.get(resources.infrastructure, 'data') as K8sResourceKind;


  const kubernetesVersionResponse = urlResults.getIn(['version', 'result']);

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
                key="name"
                title="Name"
                value={getClusterName()}
                isLoading={false}
              />
              <DetailItem
                key="provider"
                title="Provider"
                value={getInfrastructurePlatform(infrastructureData)}
                isLoading={!infrastructureLoaded && !infrastructureError}
              />
              <DetailItem
                key="openshift"
                title="OpenShift version"
                value={openshiftVersion}
                isLoading={!clusterVersionLoaded && !clusterVersionError}
              />
            </>
          ) : (
            <DetailItem
              key="kubernetes"
              title="Kubernetes version"
              value={getK8sGitVersion(kubernetesVersionResponse)}
              isLoading={!kubernetesVersionResponse}
            />
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
