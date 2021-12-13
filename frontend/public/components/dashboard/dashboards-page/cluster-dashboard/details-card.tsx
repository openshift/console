import * as React from 'react';
import { connect } from 'react-redux';
import { InProgressIcon } from '@patternfly/react-icons';
import {
  BlueArrowCircleUpIcon,
  FLAGS,
  getInfrastructureAPIURL,
  getInfrastructurePlatform,
  isSingleNode,
} from '@console/shared';
import { Card, CardBody, CardHeader, CardTitle, CardActions } from '@patternfly/react-core';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import { useTranslation } from 'react-i18next';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';

import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { ClusterVersionModel } from '../../../../models';
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
} from '../../../../module/k8s';
import { flagPending, featureReducerName } from '../../../../reducers/features';
import { ExternalLink, useAccessReview, LoadingInline } from '../../../utils';
import { RootState } from '../../../../redux';
import { Link } from 'react-router-dom';
import { useK8sWatchResource } from '../../../utils/k8s-watch-hook';
import { ClusterDashboardContext } from './context';

const ClusterVersion: React.FC<ClusterVersionProps> = ({ cv }) => {
  const desiredVersion = getDesiredClusterVersion(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const status = getClusterUpdateStatus(cv);
  const clusterVersionIsEditable =
    useAccessReview({
      group: ClusterVersionModel.apiGroup,
      resource: ClusterVersionModel.plural,
      verb: 'patch',
      name: 'version',
    }) && window.SERVER_FLAGS.branding !== 'dedicated';
  const { t } = useTranslation();

  switch (status) {
    case ClusterUpdateStatus.Updating:
      return (
        <>
          <span className="co-select-to-copy">{desiredVersion}</span>
          <div>
            <Link to="/settings/cluster/">
              <InProgressIcon className="co-icon-and-text__icon" />
              {t('public~Updating')}
            </Link>
          </div>
        </>
      );
    case ClusterUpdateStatus.UpdatesAvailable:
      return (
        <>
          <span className="co-select-to-copy">{desiredVersion}</span>
          {clusterVersionIsEditable && (
            <div>
              <Link to="/settings/cluster?showVersions">
                <BlueArrowCircleUpIcon className="co-icon-space-r" />
                {t('public~Update cluster')}
              </Link>
            </div>
          )}
        </>
      );
    default:
      return lastVersion ? (
        <span className="co-select-to-copy">{lastVersion}</span>
      ) : (
        <span className="text-secondary">{t('public~Not available')}</span>
      );
  }
};

const clusterVersionResource: WatchK8sResource = {
  kind: referenceForModel(ClusterVersionModel),
  namespaced: false,
  name: 'version',
  isList: false,
};

const mapStateToProps = (state: RootState) => ({
  openshiftFlag: state[featureReducerName].get(FLAGS.OPENSHIFT),
});

export const DetailsCard_ = connect(mapStateToProps)(
  ({ watchK8sResource, stopWatchK8sResource, openshiftFlag }: DetailsCardProps) => {
    const { t } = useTranslation();
    const { infrastructure, infrastructureLoaded, infrastructureError } = React.useContext(
      ClusterDashboardContext,
    );
    const [k8sVersion, setK8sVersion] = React.useState<Response>();
    const [k8sVersionError, setK8sVersionError] = React.useState();

    const [clusterVersionData, clusterVersionLoaded, clusterVersionError] = useK8sWatchResource<
      ClusterVersionKind
    >(clusterVersionResource);
    React.useEffect(() => {
      if (flagPending(openshiftFlag)) {
        return;
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

    const clusterId = getClusterID(clusterVersionData);
    const openShiftVersion = getOpenShiftVersion(clusterVersionData);
    const cvChannel = getClusterVersionChannel(clusterVersionData);

    const infrastructurePlatform = getInfrastructurePlatform(infrastructure);
    const infrastuctureApiUrl = getInfrastructureAPIURL(infrastructure);

    const k8sGitVersion = getK8sGitVersion(k8sVersion);

    return (
      <Card data-test-id="details-card">
        <CardHeader>
          <CardTitle>{t('public~Details')}</CardTitle>
          <CardActions className="co-overview-card__actions">
            <Link to="/settings/cluster/">{t('public~View settings')}</Link>
          </CardActions>
        </CardHeader>
        <CardBody>
          {flagPending(openshiftFlag) ? (
            <LoadingInline />
          ) : (
            <DetailsBody>
              {openshiftFlag ? (
                <>
                  <DetailItem
                    title={t('public~Cluster API address')}
                    isLoading={!infrastructureLoaded}
                    error={!!infrastructureError || (infrastructure && !infrastuctureApiUrl)}
                    valueClassName="co-select-to-copy"
                  >
                    {infrastuctureApiUrl}
                  </DetailItem>
                  <DetailItem
                    title={t('public~Cluster ID')}
                    error={!!clusterVersionError || (clusterVersionLoaded && !clusterId)}
                    isLoading={!clusterVersionLoaded}
                  >
                    <div className="co-select-to-copy">{clusterId}</div>
                    {window.SERVER_FLAGS.branding !== 'okd' &&
                      window.SERVER_FLAGS.branding !== 'azure' && (
                        <ExternalLink
                          text={t('public~OpenShift Cluster Manager')}
                          href={getOCMLink(clusterId)}
                        />
                      )}
                  </DetailItem>
                  <DetailItem
                    title={t('public~Provider')}
                    error={!!infrastructureError || (infrastructure && !infrastructurePlatform)}
                    isLoading={!infrastructureLoaded}
                    valueClassName="co-select-to-copy"
                  >
                    {infrastructurePlatform}
                  </DetailItem>
                  <DetailItem
                    title={t('public~OpenShift version')}
                    error={!!clusterVersionError || (clusterVersionLoaded && !openShiftVersion)}
                    isLoading={!clusterVersionLoaded}
                  >
                    <ClusterVersion cv={clusterVersionData} />
                  </DetailItem>
                  <DetailItem
                    title={t('public~Update channel')}
                    isLoading={!clusterVersionLoaded && !clusterVersionError}
                    error={!!clusterVersionError || (clusterVersionLoaded && !cvChannel)}
                    valueClassName="co-select-to-copy"
                  >
                    {cvChannel}
                  </DetailItem>
                  {isSingleNode(infrastructure) && (
                    <DetailItem
                      title={t('public~Control plane high availability')}
                      isLoading={false}
                      valueClassName="co-select-to-copy"
                    >
                      {t('public~No (single master)')}
                    </DetailItem>
                  )}
                </>
              ) : (
                <DetailItem
                  key="kubernetes"
                  title={t('public~Kubernetes version')}
                  error={!!k8sVersionError || (k8sVersion && !k8sGitVersion)}
                  isLoading={!k8sVersion}
                  valueClassName="co-select-to-copy"
                >
                  {k8sGitVersion}
                </DetailItem>
              )}
            </DetailsBody>
          )}
        </CardBody>
      </Card>
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
