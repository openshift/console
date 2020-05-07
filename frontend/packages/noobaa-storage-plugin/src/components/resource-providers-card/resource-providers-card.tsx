import * as React from 'react';
import * as _ from 'lodash';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { FieldLevelHelp } from '@console/internal/components/utils/index';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { PrometheusResponse } from '@console/shared/src/types/monitoring';
import { getMetric } from '../../utils';
import { ResourceProvidersBody } from './resource-providers-card-body';
import { ResourceProvidersItem, ProviderType } from './resource-providers-card-item';
import './resource-providers-card.scss';

const RESOURCE_PROVIDERS_QUERY = {
  PROVIDERS_TYPES: ' NooBaa_cloud_types',
  UNHEALTHY_PROVIDERS_TYPES: 'NooBaa_unhealthy_cloud_types',
  RESOURCES_LINK_QUERY: 'NooBaa_system_links',
};

const getProviderType = (provider: ProviderPrometheusData): string =>
  _.get(provider, 'metric.type', null);
const getProviderCount = (provider: ProviderPrometheusData): number =>
  Number(_.get(provider, 'value[1]', null));

const filterProviders = (allProviders: ProviderType): string[] => {
  return _.keys(allProviders).filter((provider) => allProviders[provider] > 0);
};

const createProvidersList = (data: PrometheusResponse): ProviderType => {
  const providers = _.get(data, 'data.result', null);
  const providersList: ProviderType = {};
  if (_.isNil(providers)) return {};
  providers.forEach((provider) => {
    providersList[getProviderType(provider)] = getProviderCount(provider);
  });
  return providersList;
};

const ResourceProviders: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    watchPrometheus(RESOURCE_PROVIDERS_QUERY.PROVIDERS_TYPES);
    watchPrometheus(RESOURCE_PROVIDERS_QUERY.UNHEALTHY_PROVIDERS_TYPES);
    return () => {
      stopWatchPrometheusQuery(RESOURCE_PROVIDERS_QUERY.PROVIDERS_TYPES);
      stopWatchPrometheusQuery(RESOURCE_PROVIDERS_QUERY.UNHEALTHY_PROVIDERS_TYPES);
    };
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const providersTypesQueryResult = prometheusResults.getIn([
    RESOURCE_PROVIDERS_QUERY.PROVIDERS_TYPES,
    'data',
  ]) as PrometheusResponse;
  const providersTypesQueryResultError = prometheusResults.getIn([
    RESOURCE_PROVIDERS_QUERY.PROVIDERS_TYPES,
    'loadError',
  ]);

  const unhealthyProvidersTypesQueryResult = prometheusResults.getIn([
    RESOURCE_PROVIDERS_QUERY.UNHEALTHY_PROVIDERS_TYPES,
    'data',
  ]) as PrometheusResponse;
  const unhealthyProvidersTypesQueryResultError = prometheusResults.getIn([
    RESOURCE_PROVIDERS_QUERY.UNHEALTHY_PROVIDERS_TYPES,
    'loadError',
  ]);

  const resourcesLinksResponse = prometheusResults.getIn([
    RESOURCE_PROVIDERS_QUERY.RESOURCES_LINK_QUERY,
    'data',
  ]) as PrometheusResponse;
  const resourcesLinksResponseError = prometheusResults.getIn([
    RESOURCE_PROVIDERS_QUERY.RESOURCES_LINK_QUERY,
    'loadError',
  ]);

  const error =
    !!providersTypesQueryResultError ||
    !!unhealthyProvidersTypesQueryResultError ||
    !!resourcesLinksResponseError;

  const noobaaResourcesLink = getMetric(resourcesLinksResponse, 'resources');

  const allProviders = createProvidersList(providersTypesQueryResult);
  const unhealthyProviders = createProvidersList(unhealthyProvidersTypesQueryResult);

  const providerTypes = filterProviders(allProviders);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Resource Providers</DashboardCardTitle>
        <FieldLevelHelp>
          A list of all MCG (Multi-cloud gateway) resources that are currently in use. Those
          resources are used to store data according to the buckets policies and can be a
          cloud-based resource or a bare metal resource.
        </FieldLevelHelp>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ResourceProvidersBody
          isLoading={!error && !(providersTypesQueryResult && unhealthyProvidersTypesQueryResult)}
          hasProviders={!_.isEmpty(allProviders)}
          error={error}
        >
          {providerTypes.map((provider) => (
            <ResourceProvidersItem
              count={allProviders[provider]}
              key={provider}
              link={noobaaResourcesLink}
              title={provider}
              unhealthyProviders={unhealthyProviders}
            />
          ))}
        </ResourceProvidersBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type ProviderPrometheusData = {
  metric: { [key: string]: any };
  value?: [number, string | number];
};

export const ResourceProvidersCard = withDashboardResources(ResourceProviders);
