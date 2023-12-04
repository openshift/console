import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import {
  BlueArrowCircleUpIcon,
  FLAGS,
  getInfrastructureAPIURL,
  getInfrastructurePlatform,
  isSingleNode,
  useFlag,
  useCanClusterUpgrade,
} from '@console/shared';
import { ErrorBoundaryInline } from '@console/shared/src/components/error';
import {
  useResolvedExtensions,
  isOverviewDetailItem,
  isCustomOverviewDetailItem,
  WatchK8sResource,
  CustomOverviewDetailItem as CustomOverviewDetailItemType,
  OverviewDetailItem as OverviewDetailItemType,
} from '@console/dynamic-plugin-sdk';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { OverviewDetailItem } from '@openshift-console/plugin-shared/src';

import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { ClusterVersionModel } from '../../../../models';
import {
  ServiceLevel,
  useServiceLevelTitle,
  ServiceLevelText,
  ServiceLevelLoading,
} from '../../../utils/service-level';
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
import { flagPending } from '../../../../reducers/features';
import { ExternalLink, LoadingInline } from '../../../utils';
import { Link } from 'react-router-dom-v5-compat';
import { useK8sWatchResource } from '../../../utils/k8s-watch-hook';
import { ClusterDashboardContext } from './context';

const ClusterVersion: React.FC<ClusterVersionProps> = ({ cv }) => {
  const { t } = useTranslation();
  const desiredVersion = getDesiredClusterVersion(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const canUpgrade = useCanClusterUpgrade();
  const status = getClusterUpdateStatus(cv);

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
          {canUpgrade && (
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

export const DetailsCard = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource }: DetailsCardProps) => {
    const { t } = useTranslation();
    const openshiftFlag = useFlag(FLAGS.OPENSHIFT);
    const { infrastructure, infrastructureLoaded, infrastructureError } = React.useContext(
      ClusterDashboardContext,
    );
    const [k8sVersion, setK8sVersion] = React.useState<Response>();
    const [k8sVersionError, setK8sVersionError] = React.useState();
    const [clusterVersionData, clusterVersionLoaded, clusterVersionError] = useK8sWatchResource<
      ClusterVersionKind
    >(clusterVersionResource);
    const [detailItemsExtensions] = useResolvedExtensions<OverviewDetailItemType>(
      isOverviewDetailItem,
    );
    const [customDetailItemsExtensions] = useResolvedExtensions<CustomOverviewDetailItemType>(
      isCustomOverviewDetailItem,
    );

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
    const serviceLevelTitle = useServiceLevelTitle();

    const clusterID = getClusterID(clusterVersionData);
    const openShiftVersion = getOpenShiftVersion(clusterVersionData);
    const cvChannel = getClusterVersionChannel(clusterVersionData);

    const infrastructurePlatform = getInfrastructurePlatform(infrastructure);
    const infrastuctureApiUrl = getInfrastructureAPIURL(infrastructure);

    const k8sGitVersion = getK8sGitVersion(k8sVersion);

    return (
      <Card data-test-id="details-card" isClickable isSelectable>
        <CardHeader
          actions={{
            actions: (
              <>
                <Link to="/settings/cluster/" data-test="details-card-view-settings">
                  {t('public~View settings')}
                </Link>
              </>
            ),
            hasNoOffset: false,
            className: 'co-overview-card__actions',
          }}
        >
          <CardTitle>{t('public~Details')}</CardTitle>
        </CardHeader>
        <CardBody>
          {flagPending(openshiftFlag) ? (
            <LoadingInline />
          ) : (
            <DetailsBody>
              {openshiftFlag ? (
                <>
                  <OverviewDetailItem
                    title={t('public~Cluster API address')}
                    isLoading={!infrastructureLoaded}
                    error={
                      !!infrastructureError || (infrastructure && !infrastuctureApiUrl)
                        ? t('public~Not available')
                        : undefined
                    }
                    valueClassName="co-select-to-copy"
                  >
                    {infrastuctureApiUrl}
                  </OverviewDetailItem>
                  <OverviewDetailItem
                    title={t('public~Cluster ID')}
                    error={
                      !!clusterVersionError || (clusterVersionLoaded && !clusterID)
                        ? t('public~Not available')
                        : undefined
                    }
                    isLoading={!clusterVersionLoaded}
                  >
                    <div className="co-select-to-copy">{clusterID}</div>
                    {window.SERVER_FLAGS.branding !== 'okd' &&
                      window.SERVER_FLAGS.branding !== 'azure' && (
                        <ExternalLink
                          text={t('public~OpenShift Cluster Manager')}
                          href={getOCMLink(clusterID)}
                        />
                      )}
                  </OverviewDetailItem>
                  <OverviewDetailItem
                    title={t('public~Infrastructure provider')}
                    error={
                      !!infrastructureError || (infrastructure && !infrastructurePlatform)
                        ? t('public~Not available')
                        : undefined
                    }
                    isLoading={!infrastructureLoaded}
                    valueClassName="co-select-to-copy"
                  >
                    {infrastructurePlatform}
                  </OverviewDetailItem>
                  <OverviewDetailItem
                    title={t('public~OpenShift version')}
                    error={
                      !!clusterVersionError || (clusterVersionLoaded && !openShiftVersion)
                        ? t('public~Not available')
                        : undefined
                    }
                    isLoading={!clusterVersionLoaded}
                  >
                    <ClusterVersion cv={clusterVersionData} />
                  </OverviewDetailItem>

                  <ServiceLevel
                    clusterID={clusterID}
                    loading={
                      <OverviewDetailItem title={serviceLevelTitle}>
                        <ServiceLevelLoading />
                      </OverviewDetailItem>
                    }
                  >
                    <OverviewDetailItem title={serviceLevelTitle}>
                      {/* Service Level handles loading and error state */}
                      <ServiceLevelText clusterID={clusterID} />
                    </OverviewDetailItem>
                  </ServiceLevel>

                  <OverviewDetailItem
                    title={t('public~Update channel')}
                    isLoading={!clusterVersionLoaded && !clusterVersionError}
                    error={
                      !!clusterVersionError || (clusterVersionLoaded && !cvChannel)
                        ? t('public~Not available')
                        : undefined
                    }
                    valueClassName="co-select-to-copy"
                  >
                    {cvChannel}
                  </OverviewDetailItem>
                  {isSingleNode(infrastructure) && (
                    <OverviewDetailItem
                      title={t('public~Control plane high availability')}
                      isLoading={false}
                      valueClassName="co-select-to-copy"
                    >
                      {t('public~No (single control plane node)')}
                    </OverviewDetailItem>
                  )}
                  {detailItemsExtensions.map((e) => {
                    const Component = e.properties.component;
                    return (
                      <ErrorBoundaryInline
                        key={e.uid}
                        wrapper={({ children }) => (
                          <OverviewDetailItem title="">{children}</OverviewDetailItem>
                        )}
                      >
                        <Component />
                      </ErrorBoundaryInline>
                    );
                  })}
                  {customDetailItemsExtensions.map((e) => {
                    const { component: Component, error, isLoading, ...props } = e.properties;
                    return (
                      <ErrorBoundaryInline
                        key={e.uid}
                        wrapper={({ children }) => (
                          <OverviewDetailItem title="">{children}</OverviewDetailItem>
                        )}
                      >
                        <OverviewDetailItem {...props} error={error?.()} isLoading={isLoading?.()}>
                          <Component />
                        </OverviewDetailItem>
                      </ErrorBoundaryInline>
                    );
                  })}
                </>
              ) : (
                <OverviewDetailItem
                  key="kubernetes"
                  title={t('public~Kubernetes version')}
                  error={
                    !!k8sVersionError || (k8sVersion && !k8sGitVersion)
                      ? t('public~Not available')
                      : undefined
                  }
                  isLoading={!k8sVersion}
                  valueClassName="co-select-to-copy"
                >
                  {k8sGitVersion}
                </OverviewDetailItem>
              )}
            </DetailsBody>
          )}
        </CardBody>
      </Card>
    );
  },
);

type DetailsCardProps = DashboardItemProps & {
  openshiftFlag: boolean;
};

type ClusterVersionProps = {
  cv: ClusterVersionKind;
};
