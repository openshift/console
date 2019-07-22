import * as React from 'react';
import * as _ from 'lodash';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardHelp,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { ResourceProvidersBody } from './resource-providers-card-body';
import { ResourceProvidersItem, ProviderType } from './resource-providers-card-item';
import './resource-providers-card.scss';

const RESOURCE_PROVIDERS_QUERY = {
  PROVIDERS_TYPES: ' NooBaa_cloud_types',
  UNHEALTHY_PROVIDERS_TYPES: 'NooBaa_unhealthy_cloud_types',
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
  if (_.isNil(providers)) return null;
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
    'result',
  ]);
  const unhealthyProvidersTypesQueryResult = prometheusResults.getIn([
    RESOURCE_PROVIDERS_QUERY.UNHEALTHY_PROVIDERS_TYPES,
    'result',
  ]);

  const allProviders = createProvidersList(providersTypesQueryResult);
  const unhealthyProviders = createProvidersList(unhealthyProvidersTypesQueryResult);

  const providerTypes = filterProviders(allProviders);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Resource Providers</DashboardCardTitle>
        <DashboardCardHelp>
          A list of all MCG (Multi-cloud gateway) resources that are currently in use. Those
          resources are used to store data according to the buckets policies and can be a
          cloud-based resource or a bare metal resource.
        </DashboardCardHelp>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ResourceProvidersBody
          isLoading={!(providersTypesQueryResult && unhealthyProvidersTypesQueryResult)}
          hasProviders={!_.isEmpty(allProviders) || !_.isNil(allProviders)}
        >
          {providerTypes.map((provider) => (
            <ResourceProvidersItem
              key={provider}
              title={provider}
              count={allProviders[provider]}
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
