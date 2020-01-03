import * as React from 'react';
import * as _ from 'lodash';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { getName } from '@console/shared';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource } from '@console/internal/components/utils';
import { StorageClassModel } from '@console/internal/models';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getMetric, getGaugeValue } from '../../utils';
import { NooBaaObjectBucketClaimModel } from '../../models';
import { BucketsItem, BucketsType } from './buckets-card-item';
import './buckets-card.scss';

enum BucketsCardQueries {
  BUCKETS_LINK_QUERY = 'NooBaa_system_links',
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

const storageClassResource: FirehoseResource = {
  kind: StorageClassModel.kind,
  isList: true,
  prop: 'storageclass',
};

const getNoobaaStorageClasses = (storageClassesList) =>
  storageClassesList.filter((sc) => _.endsWith(_.get(sc, 'provisioner'), 'noobaa.io/obc'));

const getNoobaaObcCount = (obcList, noobaaStorageClasses) => {
  const result = obcList.filter((o) => {
    const storageClassName = _.get(o, 'spec.storageClassName');
    return noobaaStorageClasses.some((sc) => getName(sc) === storageClassName);
  });
  return result.length;
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
    watchK8sResource(storageClassResource);
    Object.keys(BucketsCardQueries).forEach((key) => watchPrometheus(BucketsCardQueries[key]));
    return () => {
      Object.keys(BucketsCardQueries).forEach((key) =>
        stopWatchPrometheusQuery(BucketsCardQueries[key]),
      );
      stopWatchK8sResource(objectBucketClaimsResource);
      stopWatchK8sResource(storageClassResource);
    };
  }, [watchK8sResource, watchPrometheus, stopWatchK8sResource, stopWatchPrometheusQuery]);

  const obCountResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKETS_COUNT,
    'data',
  ]) as PrometheusResponse;
  const obCountResponseError = prometheusResults.getIn([
    BucketsCardQueries.BUCKETS_COUNT,
    'loadError',
  ]);
  const obObjectsCountResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_OBJECTS_COUNT,
    'data',
  ]) as PrometheusResponse;
  const obObjectsCountResponseError = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_OBJECTS_COUNT,
    'loadError',
  ]);
  const unhealthyObResponse = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS,
    'data',
  ]) as PrometheusResponse;
  const unhealthyObResponseError = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS,
    'loadError',
  ]);
  const obcCountResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_CLAIMS_COUNT,
    'data',
  ]) as PrometheusResponse;
  const obcCountResponseError = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_CLAIMS_COUNT,
    'loadError',
  ]);
  const obcObjectsCountsResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_CLAIMS_OBJECTS_COUNT,
    'data',
  ]) as PrometheusResponse;
  const obcObjectsCountsResponseError = prometheusResults.getIn([
    BucketsCardQueries.BUCKET_CLAIMS_OBJECTS_COUNT,
    'loadError',
  ]);
  const unhealthyObcCountResponse = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS_CLAIMS,
    'data',
  ]) as PrometheusResponse;
  const unhealthyObcCountResponseError = prometheusResults.getIn([
    BucketsCardQueries.UNHEALTHY_BUCKETS_CLAIMS,
    'loadError',
  ]);
  const bucketsLinksResponse = prometheusResults.getIn([
    BucketsCardQueries.BUCKETS_LINK_QUERY,
    'data',
  ]) as PrometheusResponse;

  const obcData = _.get(resources.obc, 'data', []) as K8sResourceKind[];
  const storageClassesData = _.get(resources.storageclass, 'data', []) as K8sResourceKind[];
  const noobaaBucketsLink = getMetric(bucketsLinksResponse, 'buckets');

  const noobaaStorageClasses = getNoobaaStorageClasses(storageClassesData);
  const k8sObc = getNoobaaObcCount(obcData, noobaaStorageClasses);
  const prometheusObc = getGaugeValue(obcCountResponse);
  const unhealthyObcCount = getGaugeValue(unhealthyObcCountResponse);

  const bucketProps: BucketsType = {
    bucketsCount: getGaugeValue(obCountResponse),
    objectsCount: getGaugeValue(obObjectsCountResponse),
    unhealthyCount: getGaugeValue(unhealthyObResponse),
    isLoading: !(obCountResponse && obObjectsCountResponse && unhealthyObResponse),
    error: obCountResponseError || obObjectsCountResponseError || unhealthyObResponseError,
  };
  const bucketClaimProps: BucketsType = {
    bucketsCount: String(k8sObc),
    objectsCount: getGaugeValue(obcObjectsCountsResponse),
    unhealthyCount: k8sObc - Number(prometheusObc) + Number(unhealthyObcCount),
    isLoading: !(obcCountResponse && obcObjectsCountsResponse && unhealthyObcCountResponse),
    error: obcCountResponseError || obcObjectsCountsResponseError || unhealthyObcCountResponseError,
  };
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Buckets</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <BucketsItem title="Noobaa Bucket" {...bucketProps} link={noobaaBucketsLink} />
        <BucketsItem title="Object Bucket Claim" {...bucketClaimProps} link={noobaaBucketsLink} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const BucketsCard = withDashboardResources(ObjectDashboardBucketsCard);
