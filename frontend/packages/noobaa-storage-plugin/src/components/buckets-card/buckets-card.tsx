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
import { getMetric } from '../../utils';
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

const getPropsData = (data) => _.get(data, 'data.result[0].value[1]', null);

const ObjectDashboardBucketsCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    Object.keys(BucketsCardQueries).forEach((key) => watchPrometheus(BucketsCardQueries[key]));
    return () =>
      Object.keys(BucketsCardQueries).forEach((key) =>
        stopWatchPrometheusQuery(BucketsCardQueries[key]),
      );
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const objectBucketsCount = prometheusResults.getIn([BucketsCardQueries.BUCKETS_COUNT, 'result']);
  const objectsCountOnBuckets = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_OBJECTS_COUNT,
    'result',
  ]);
  const unhealthyBucketsCount = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS,
    'result',
  ]);
  const bucketClaimsCount = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_CLAIMS_COUNT,
    'result',
  ]);
  const objectsCountOnBucketClaims = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_CLAIMS_OBJECTS_COUNT,
    'result',
  ]);
  const unhealthyBucketClaimsCount = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS_CLAIMS,
    'result',
  ]);
  const bucketsLinksResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKETS_LINK_QUERY,
    'result',
  ]);

  const noobaaSystemAddress = getMetric(bucketsLinksResponse, 'system_address');
  const noobaaSystemName = getMetric(bucketsLinksResponse, 'system_name');
  let link = null;
  if (noobaaSystemAddress && noobaaSystemName)
    link = `${noobaaSystemAddress}/fe/systems/${noobaaSystemName}/buckets/data-buckets`;

  const bucketProps: BucketsType = {
    bucketsCount: getPropsData(objectBucketsCount),
    objectsCount: getPropsData(objectsCountOnBuckets),
    unhealthyCount: getPropsData(unhealthyBucketsCount),
    isLoading: !(objectBucketsCount && objectsCountOnBuckets && unhealthyBucketsCount),
  };
  const bucketClaimProps: BucketsType = {
    bucketsCount: getPropsData(bucketClaimsCount),
    objectsCount: getPropsData(objectsCountOnBucketClaims),
    unhealthyCount: getPropsData(unhealthyBucketClaimsCount),
    isLoading: !(bucketClaimsCount && objectsCountOnBucketClaims && unhealthyBucketClaimsCount),
  };
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Buckets</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <BucketsItem title="ObjectBucket" {...bucketProps} link={link} />
        <BucketsItem title="ObjectBucketClaim" {...bucketClaimProps} link={link} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const BucketsCard = withDashboardResources(ObjectDashboardBucketsCard);
