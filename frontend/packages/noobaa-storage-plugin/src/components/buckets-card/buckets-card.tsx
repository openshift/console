import * as React from 'react';
import * as _ from 'lodash';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { FirehoseResource } from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { getMetric, getGaugeValue } from '../../utils';
import { NooBaaObjectBucketClaimModel } from '../../models';
import { BucketsItem, BucketsType } from './buckets-card-item';
import './buckets-card.scss';

enum BucketsCardQueries {
  BUCKETS_LINK_QUERY = 'NooBaa_system_info',
  BUCKETS_COUNT = 'NooBaa_num_buckets',
  BUCKET_OBJECTS_COUNT = 'NooBaa_num_objects',
  BUCKET_CLAIMS_COUNT = 'NooBaa_num_buckets_claims',
  BUCKET_CLAIMS_OBJECTS_COUNT = 'NooBaa_num_objects_buckets_claims',
  UNHEALTHY_BUCKETS = 'NooBaa_num_unhealthy_buckets',
  UNHEALTHY_BUCKETS_CLAIMS = 'NooBaa_num_unhealthy_bucket_claims',
}

const objectBucketClaimsResource: FirehoseResource = {
  kind: referenceForModel(NooBaaObjectBucketClaimModel),
  namespaced: false,
  isList: true,
  prop: 'obc',
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
    Object.keys(BucketsCardQueries).forEach((key) => watchPrometheus(BucketsCardQueries[key]));
    return () => {
      Object.keys(BucketsCardQueries).forEach((key) =>
        stopWatchPrometheusQuery(BucketsCardQueries[key]),
      );
      stopWatchK8sResource(objectBucketClaimsResource);
    };
  }, [watchK8sResource, watchPrometheus, stopWatchK8sResource, stopWatchPrometheusQuery]);

  const obCountResponse = prometheusResults.getIn([BucketsCardQueries.BUCKETS_COUNT, 'result']);
  const obObjectsCountResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_OBJECTS_COUNT,
    'result',
  ]);
  const unhealthyObResponse = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS,
    'result',
  ]);
  const obcCountResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_CLAIMS_COUNT,
    'result',
  ]);
  const obcObjectsCountsResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_CLAIMS_OBJECTS_COUNT,
    'result',
  ]);
  const unhealthyObcCountResponse = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS_CLAIMS,
    'result',
  ]);
  const bucketsLinksResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKETS_LINK_QUERY,
    'result',
  ]);

  const obcData = _.get(resources.obc, 'data', null) as K8sResourceKind[];
  const noobaaSystemAddress = getMetric(bucketsLinksResponse, 'system_address');
  const noobaaSystemName = getMetric(bucketsLinksResponse, 'system_name');
  const obcCount = getGaugeValue(obcCountResponse);
  const unhealthyObcCount = getGaugeValue(unhealthyObcCountResponse);

  let resultantUnhealthyObcCount: number = null;
  let link: string = null;

  if (obcCount && obcData && unhealthyObcCount)
    resultantUnhealthyObcCount = obcData.length - Number(obcCount) + Number(unhealthyObcCount);

  if (noobaaSystemAddress && noobaaSystemName)
    link = `${noobaaSystemAddress}fe/systems/${noobaaSystemName}/buckets/data-buckets`;

  const bucketProps: BucketsType = {
    bucketsCount: getGaugeValue(obCountResponse),
    objectsCount: getGaugeValue(obObjectsCountResponse),
    unhealthyCount: getGaugeValue(unhealthyObResponse),
    isLoading: !(obCountResponse && obObjectsCountResponse && unhealthyObResponse),
  };
  const bucketClaimProps: BucketsType = {
    bucketsCount: obcCount,
    objectsCount: getGaugeValue(obcObjectsCountsResponse),
    unhealthyCount: resultantUnhealthyObcCount,
    isLoading: !(obcCountResponse && obcObjectsCountsResponse && unhealthyObcCountResponse),
  };
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Buckets</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <div className="co-dashboard-card__body--no-padding">
          <BucketsItem title="ObjectBucket" {...bucketProps} link={link} />
          <BucketsItem title="ObjectBucketClaim" {...bucketClaimProps} link={link} />
        </div>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const BucketsCard = withDashboardResources(ObjectDashboardBucketsCard);
