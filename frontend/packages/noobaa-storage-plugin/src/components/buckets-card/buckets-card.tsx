import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { RedExclamationCircleIcon } from '@console/shared';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource } from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import InventoryItem, {
  ResourceInventoryItem,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { NooBaaObjectBucketClaimModel, NooBaaObjectBucketModel } from '../../models';
import { getGaugeValue } from '../../utils';
import { BucketsTitle } from './buckets-card-item';
import { getObcStatusGroups, getObStatusGroups } from './utils';
import './buckets-card.scss';

enum BucketsCardQueries {
  BUCKETS_COUNT = 'NooBaa_num_buckets',
  BUCKET_OBJECTS_COUNT = 'NooBaa_num_objects',
  UNHEALTHY_BUCKETS = 'NooBaa_num_unhealthy_buckets',
}

const objectBucketClaimsResource: FirehoseResource = {
  kind: referenceForModel(NooBaaObjectBucketClaimModel),
  namespaced: false,
  isList: true,
  prop: 'obc',
};

const objectBucketResource: FirehoseResource = {
  kind: referenceForModel(NooBaaObjectBucketModel),
  namespaced: false,
  isList: true,
  prop: 'ob',
};

const ObjectDashboardBucketsCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  watchPrometheus,
  stopWatchPrometheusQuery,
  stopWatchK8sResource,
  prometheusResults,
  resources,
}) => {
  React.useEffect(() => {
    watchK8sResource(objectBucketClaimsResource);
    watchK8sResource(objectBucketResource);
    Object.keys(BucketsCardQueries).forEach((key) => watchPrometheus(BucketsCardQueries[key]));
    return () => {
      stopWatchK8sResource(objectBucketClaimsResource);
      stopWatchK8sResource(objectBucketResource);
      Object.keys(BucketsCardQueries).forEach((key) =>
        stopWatchPrometheusQuery(BucketsCardQueries[key]),
      );
    };
  }, [watchK8sResource, watchPrometheus, stopWatchK8sResource, stopWatchPrometheusQuery]);

  const noobaaCount = prometheusResults.getIn([
    BucketsCardQueries.BUCKETS_COUNT,
    'data',
  ]) as PrometheusResponse;
  const noobaaCountError = prometheusResults.getIn([BucketsCardQueries.BUCKETS_COUNT, 'loadError']);
  const noobaaObjectsCount = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_OBJECTS_COUNT,
    'data',
  ]) as PrometheusResponse;
  const noobaaObjectsCountError = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_OBJECTS_COUNT,
    'loadError',
  ]);
  const unhealthyNoobaaBuckets = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS,
    'data',
  ]) as PrometheusResponse;
  const unhealthyNoobaaBucketsError = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS,
    'loadError',
  ]);

  const obcData = (resources?.obc?.data as K8sResourceKind[]) ?? [];
  const obcLoaded = resources?.obc?.loaded;
  const obcLoadError = resources?.obc?.loadError;

  const obData = (resources?.ob?.data as K8sResourceKind[]) ?? [];
  const obLoaded = resources?.ob?.loaded;
  const obLoadError = resources?.ob?.loadError;

  const unhealthyNoobaaBucketsCount = Number(getGaugeValue(unhealthyNoobaaBuckets));

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Buckets</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <InventoryItem
          isLoading={!(noobaaCount && unhealthyNoobaaBuckets)}
          error={!!(noobaaCountError || unhealthyNoobaaBucketsError)}
          title="NooBaa Bucket"
          count={Number(getGaugeValue(noobaaCount))}
          TitleComponent={React.useCallback(
            (props) => (
              <BucketsTitle
                objects={noobaaObjectsCount}
                error={!!noobaaObjectsCountError}
                {...props}
              />
            ),
            [noobaaObjectsCount, noobaaObjectsCountError],
          )}
        >
          {unhealthyNoobaaBucketsCount > 0 && (
            <>
              <RedExclamationCircleIcon />
              <span className="nb-buckets-card__buckets-failure-status-count">
                {unhealthyNoobaaBucketsCount}
              </span>
            </>
          )}
        </InventoryItem>
        <ResourceInventoryItem
          isLoading={!obLoaded}
          error={!!obLoadError}
          kind={NooBaaObjectBucketModel}
          resources={obData}
          mapper={getObStatusGroups}
        />
        <ResourceInventoryItem
          isLoading={!obcLoaded}
          error={!!obcLoadError}
          kind={NooBaaObjectBucketClaimModel}
          resources={obcData}
          mapper={getObcStatusGroups}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const BucketsCard = withDashboardResources(ObjectDashboardBucketsCard);
