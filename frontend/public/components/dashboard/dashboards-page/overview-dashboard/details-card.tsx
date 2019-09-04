import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Button } from '@patternfly/react-core';
import { ArrowCircleUpIcon, InProgressIcon } from '@patternfly/react-icons';
import { getInfrastructureAPIURL, getInfrastructurePlatform } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { InfrastructureModel, ClusterVersionModel } from '../../../../models';
import {
  referenceForModel,
  K8sResourceKind,
  getOpenShiftVersion,
  getK8sGitVersion,
  ClusterVersionKind,
  getClusterID,
  getDesiredClusterVersion,
  getLastCompletedUpdate,
  getClusterUpdateStatus,
  getClusterVersionChannel,
  ClusterUpdateStatus,
  getOCMLink,
} from '../../../../module/k8s';
import { FLAGS } from '../../../../const';
import { flagPending, featureReducerName } from '../../../../reducers/features';
import { FirehoseResource, ExternalLink } from '../../../utils';
import { RootState } from '../../../../redux';
import { clusterUpdateModal } from '../../../modals';
import { Link } from 'react-router-dom';

const ClusterVersion: React.FC<ClusterVersionProps> = ({ cv }) => {
  const desiredVersion = getDesiredClusterVersion(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const status = getClusterUpdateStatus(cv);

  switch (status) {
    case ClusterUpdateStatus.Updating:
      return (
        <>
          <span className="co-select-to-copy">{desiredVersion}</span>
          <div>
            <Link to="/settings/cluster/">
              <InProgressIcon className="co-icon-and-text__icon" />
              Updating
            </Link>
          </div>
        </>
      );
    case ClusterUpdateStatus.UpdatesAvailable:
      return (
        <>
          <span className="co-select-to-copy">{desiredVersion}</span>
          <div>
            <Button
              variant="link"
              className="btn-link--no-btn-default-values"
              onClick={() => clusterUpdateModal({ cv })}
              icon={<ArrowCircleUpIcon />}
              isInline
            >
              Update
            </Button>
          </div>
        </>
      );
    default:
      return lastVersion ? (
        <span className="co-select-to-copy">{lastVersion}</span>
      ) : (
        <span className="text-secondary">Not available</span>
      );
  }
};

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

export const DetailsCard_ = connect(mapStateToProps)(
  ({
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
    const cvChannel = getClusterVersionChannel(clusterVersionData);

    const infrastructureLoaded = _.get(resources.infrastructure, 'loaded', false);
    const infrastructureError = _.get(resources.infrastructure, 'loadError');
    const infrastructureData = _.get(resources.infrastructure, 'data') as K8sResourceKind;
    const infrastructurePlatform = getInfrastructurePlatform(infrastructureData);
    const infrastuctureApiUrl = getInfrastructureAPIURL(infrastructureData);

    const kubernetesVersionData = urlResults.getIn(['version', 'data']);
    const kubernetesVersionError = urlResults.getIn(['version', 'loadError']);
    const k8sGitVersion = getK8sGitVersion(kubernetesVersionData);

    return (
      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Details</DashboardCardTitle>
          <DashboardCardLink to="/settings/cluster/">View settings</DashboardCardLink>
        </DashboardCardHeader>
        <DashboardCardBody isLoading={flagPending(openshiftFlag)}>
          <DetailsBody>
            {openshiftFlag ? (
              <>
                <DetailItem
                  title="Cluster API address"
                  isLoading={!infrastructureLoaded && !infrastructureError}
                  error={!!infrastructureError || !infrastuctureApiUrl}
                  valueClassName="co-select-to-copy"
                >
                  {infrastuctureApiUrl}
                </DetailItem>
                <DetailItem
                  title="Cluster ID"
                  error={!!clusterVersionError || (clusterVersionLoaded && !clusterId)}
                  isLoading={!clusterVersionLoaded}
                >
                  <div className="co-select-to-copy">{clusterId}</div>
                  <ExternalLink text="OpenShift Cluster Manager" href={getOCMLink(clusterId)} />
                </DetailItem>
                <DetailItem
                  title="Provider"
                  error={!!infrastructureError || (infrastructureLoaded && !infrastructurePlatform)}
                  isLoading={!infrastructureLoaded}
                  valueClassName="co-select-to-copy"
                >
                  {infrastructurePlatform}
                </DetailItem>
                <DetailItem
                  title="OpenShift version"
                  error={!!clusterVersionError || (clusterVersionLoaded && !openShiftVersion)}
                  isLoading={!clusterVersionLoaded}
                >
                  <ClusterVersion cv={clusterVersionData} />
                </DetailItem>
                <DetailItem
                  title="Update channel"
                  isLoading={!clusterVersionLoaded && !clusterVersionError}
                  error={!!clusterVersionError || !cvChannel}
                  valueClassName="co-select-to-copy"
                >
                  {cvChannel}
                </DetailItem>
              </>
            ) : (
              <DetailItem
                key="kubernetes"
                title="Kubernetes version"
                error={!!kubernetesVersionError || (kubernetesVersionData && !k8sGitVersion)}
                isLoading={!kubernetesVersionData}
                valueClassName="co-select-to-copy"
              >
                {k8sGitVersion}
              </DetailItem>
            )}
          </DetailsBody>
        </DashboardCardBody>
      </DashboardCard>
    );
  },
);

export const DetailsCard = withDashboardResources(DetailsCard_);

type DetailsCardProps = DashboardItemProps & {
  openshiftFlag: boolean;
};

type ClusterVersionProps = {
  cv: ClusterVersionKind;
};
