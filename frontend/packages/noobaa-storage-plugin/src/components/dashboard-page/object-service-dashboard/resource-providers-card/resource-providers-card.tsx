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
import { PrometheusResponse } from '@console/internal/components/graphs';
import { ResourceProviderQueries } from '../../../../queries';
import { getMetric } from '../../../../selectors';
import { ResourceProvidersBody } from './resource-providers-card-body';
import { ResourceProvidersItem, ProviderType } from './resource-providers-card-item';
import './resource-providers-card.scss';

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
    watchPrometheus(ResourceProviderQueries.PROVIDERS_TYPES);
    watchPrometheus(ResourceProviderQueries.UNHEALTHY_PROVIDERS_TYPES);
    return () => {
      stopWatchPrometheusQuery(ResourceProviderQueries.PROVIDERS_TYPES);
      stopWatchPrometheusQuery(ResourceProviderQueries.UNHEALTHY_PROVIDERS_TYPES);
    };
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const providersTypesQueryResult = prometheusResults.getIn([
    ResourceProviderQueries.PROVIDERS_TYPES,
    'data',
  ]) as PrometheusResponse;
  const providersTypesQueryResultError = prometheusResults.getIn([
    ResourceProviderQueries.PROVIDERS_TYPES,
    'loadError',
  ]);

  const unhealthyProvidersTypesQueryResult = prometheusResults.getIn([
    ResourceProviderQueries.UNHEALTHY_PROVIDERS_TYPES,
    'data',
  ]) as PrometheusResponse;
  const unhealthyProvidersTypesQueryResultError = prometheusResults.getIn([
    ResourceProviderQueries.UNHEALTHY_PROVIDERS_TYPES,
    'loadError',
  ]);

  const resourcesLinksResponse = prometheusResults.getIn([
    ResourceProviderQueries.RESOURCES_LINK_QUERY,
    'data',
  ]) as PrometheusResponse;
  const resourcesLinksResponseError = prometheusResults.getIn([
    ResourceProviderQueries.RESOURCES_LINK_QUERY,
    'loadError',
  ]);

  const error =
    !!providersTypesQueryResultError ||
    !!unhealthyProvidersTypesQueryResultError ||
    !!resourcesLinksResponseError;

  const noobaaSystemAddress = getMetric(resourcesLinksResponse, 'system_address');
  const noobaaSystemName = getMetric(resourcesLinksResponse, 'system_name');
  let link: string = null;
  if (noobaaSystemAddress && noobaaSystemName)
    link = `${noobaaSystemAddress}fe/systems/${noobaaSystemName}/resources/cloud/`;

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
          hasProviders={!_.isEmpty(allProviders) || !_.isNil(allProviders)}
          error={error}
        >
          {providerTypes.map((provider) => (
            <ResourceProvidersItem
              count={allProviders[provider]}
              key={provider}
              link={link}
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
