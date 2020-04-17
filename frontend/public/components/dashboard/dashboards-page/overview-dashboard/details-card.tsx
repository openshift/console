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
  k8sGet,
  K8sResourceKind,
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

const mapStateToProps = (state: RootState) => ({
  openshiftFlag: state[featureReducerName].get(FLAGS.OPENSHIFT),
});

export const DetailsCard_ = connect(mapStateToProps)(
  ({ watchK8sResource, stopWatchK8sResource, resources, openshiftFlag }: DetailsCardProps) => {
    const [infrastructure, setInfrastructure] = React.useState<K8sResourceKind>();
    const [infrastructureError, setInfrastructureError] = React.useState();
    const [k8sVersion, setK8sVersion] = React.useState<Response>();
    const [k8sVersionError, setK8sVersionError] = React.useState();

    React.useEffect(() => {
      const fetchInfrastructure = async () => {
        try {
          const infra = await k8sGet(InfrastructureModel, 'cluster');
          setInfrastructure(infra);
        } catch (error) {
          setInfrastructureError(error);
        }
      };
      fetchInfrastructure();
    }, []);
    React.useEffect(() => {
      if (flagPending(openshiftFlag)) {
        return;
      }
      if (openshiftFlag) {
        watchK8sResource(clusterVersionResource);
        return () => {
          stopWatchK8sResource(clusterVersionResource);
        };
      }
      const fetchK8sVersion = async () => {
        try {
          const version = await fetch('version');
          setK8sVersion(version);
        } catch (error) {
          setK8sVersionError(error);
        }
      };
      fetchK8sVersion();
    }, [openshiftFlag, watchK8sResource, stopWatchK8sResource]);

    const clusterVersionLoaded = _.get(resources.cv, 'loaded', false);
    const clusterVersionError = _.get(resources.cv, 'loadError');
    const clusterVersionData = _.get(resources.cv, 'data') as ClusterVersionKind;
    const clusterId = getClusterID(clusterVersionData);
    const openShiftVersion = getOpenShiftVersion(clusterVersionData);
    const cvChannel = getClusterVersionChannel(clusterVersionData);

    const infrastructurePlatform = getInfrastructurePlatform(infrastructure);
    const infrastuctureApiUrl = getInfrastructureAPIURL(infrastructure);

    const k8sGitVersion = getK8sGitVersion(k8sVersion);

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
                  isLoading={!infrastructure && !infrastructureError}
                  error={!!infrastructureError || (infrastructure && !infrastuctureApiUrl)}
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
                  {window.SERVER_FLAGS.branding !== 'okd' &&
                    window.SERVER_FLAGS.branding !== 'azure' && (
                      <ExternalLink text="OpenShift Cluster Manager" href={getOCMLink(clusterId)} />
                    )}
                </DetailItem>
                <DetailItem
                  title="Provider"
                  error={!!infrastructureError || (infrastructure && !infrastructurePlatform)}
                  isLoading={!infrastructure}
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
                  error={!!clusterVersionError || (clusterVersionLoaded && !cvChannel)}
                  valueClassName="co-select-to-copy"
                >
                  {cvChannel}
                </DetailItem>
              </>
            ) : (
              <DetailItem
                key="kubernetes"
                title="Kubernetes version"
                error={!!k8sVersionError || (k8sVersion && !k8sGitVersion)}
                isLoading={!k8sVersion}
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
