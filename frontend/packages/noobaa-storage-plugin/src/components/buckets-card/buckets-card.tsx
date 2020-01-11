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
import { StorageClassModel } from '@console/internal/models';
import { FirehoseResource, resourcePathFromModel } from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getMetric, getGaugeValue, isBound } from '../../utils';
import { NooBaaObjectBucketClaimModel } from '../../models';
import { BucketsItem, BucketsItemProps } from './buckets-card-item';
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

const getNoobaaStorageClassList = (storageClassesList: K8sResourceKind[]): K8sResourceKind[] =>
  storageClassesList.filter((sc: K8sResourceKind) =>
    _.endsWith(_.get(sc, 'provisioner'), 'noobaa.io/obc'),
  );

const getNoobaaObcList = (
  obcList: K8sResourceKind[],
  noobaaStorageClassList: K8sResourceKind[],
): K8sResourceKind[] =>
  obcList.filter((obc: K8sResourceKind) => {
    const storageClassName = _.get(obc, 'spec.storageClassName');
    return noobaaStorageClassList.some((sc: K8sResourceKind) => getName(sc) === storageClassName);
  });

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
      stopWatchK8sResource(objectBucketClaimsResource);
      stopWatchK8sResource(storageClassResource);
      Object.keys(BucketsCardQueries).forEach((key) =>
        stopWatchPrometheusQuery(BucketsCardQueries[key]),
      );
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

  const noobaaBucketsLink = getMetric(bucketsLinksResponse, 'buckets');

  const storageClassesData = _.get(resources.storageclass, 'data', []) as K8sResourceKind[];
  const storageClassesLoaded = _.get(resources.storageclass, 'loaded');
  const storageClassesLoadError = _.get(resources.storageclass, 'loadError');

  const obcData = _.get(resources.obc, 'data', []) as K8sResourceKind[];
  const obcLoaded = _.get(resources.obc, 'loaded');
  const obcLoadError = _.get(resources.obc, 'loadError');

  const noobaaStorageClassList = getNoobaaStorageClassList(storageClassesData);
  const noobaaObcList = getNoobaaObcList(obcData, noobaaStorageClassList);

  const obcProvisioningFailure = noobaaObcList.filter((obc) => !isBound(obc)).length;

  const bucketProps: BucketsItemProps = {
    title: 'Noobaa Bucket',
    bucketsCount: +getGaugeValue(obCountResponse),
    objectsCount: getGaugeValue(obObjectsCountResponse),
    unhealthyCounts: [+getGaugeValue(unhealthyObResponse)],
    isLoading: !(obCountResponse && obObjectsCountResponse && unhealthyObResponse),
    hasLoadError: obCountResponseError || obObjectsCountResponseError || unhealthyObResponseError,
    links: [noobaaBucketsLink],
  };

  const bucketClaimProps: BucketsItemProps = {
    title: 'Object Bucket Claim',
    bucketsCount: noobaaObcList.length,
    objectsCount: getGaugeValue(obcObjectsCountsResponse),
    unhealthyCounts: [+getGaugeValue(unhealthyObcCountResponse), obcProvisioningFailure],
    isLoading: !(
      storageClassesLoaded &&
      obcLoaded &&
      obcObjectsCountsResponse &&
      unhealthyObcCountResponse
    ),
    hasLoadError:
      storageClassesLoadError ||
      obcLoadError ||
      obcObjectsCountsResponseError ||
      unhealthyObcCountResponseError,
    links: [noobaaBucketsLink, resourcePathFromModel(NooBaaObjectBucketClaimModel)],
  };

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Buckets</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <BucketsItem {...bucketProps} />
        <BucketsItem {...bucketClaimProps} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const BucketsCard = withDashboardResources(ObjectDashboardBucketsCard);
