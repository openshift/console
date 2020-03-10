import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose } from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import * as plugins from '@console/internal/plugins';
import { getResourceList } from '@console/shared';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { safeLoadAll } from 'js-yaml';
import { ServiceBindingRequestModel } from '../../models';
import { TopologyFilters, getTopologyFilters } from './filters/filter-utils';
import { allowedResources, transformTopologyData, getHelmReleaseKey } from './topology-utils';
import { TopologyDataModel, TopologyDataResources, TrafficData } from './topology-types';
import trafficConnectorMock from './__mocks__/traffic-connector.mock';
import { HelmRelease, HelmReleaseResourcesMap } from '../helm/helm-types';

export interface RenderProps {
  data?: TopologyDataModel;
  loaded: boolean;
  loadError: string;
  serviceBinding: boolean;
}

interface StateProps {
  resourceList: plugins.OverviewCRD[];
  filters: TopologyFilters;
}

export interface ControllerProps {
  utils: Function[];
  loaded?: boolean;
  loadError?: any;
  resources?: TopologyDataResources;
  render(RenderProps): React.ReactElement;
  application: string;
  cheURL: string;
  serviceBinding: boolean;
  topologyFilters: TopologyFilters;
  trafficData?: TrafficData;
  helmResourcesMap?: HelmReleaseResourcesMap;
}

export interface TopologyDataControllerProps extends StateProps {
  namespace: string;
  render(RenderProps): React.ReactElement;
  application: string;
  knative: boolean;
  cheURL: string;
  serviceBinding: boolean;
}

const Controller: React.FC<ControllerProps> = ({
  render,
  application,
  cheURL,
  resources,
  loaded,
  loadError,
  utils,
  serviceBinding,
  topologyFilters,
  trafficData,
  helmResourcesMap,
}) =>
  render({
    loaded,
    loadError,
    serviceBinding,
    data: loaded
      ? transformTopologyData(
          resources,
          allowedResources,
          application,
          cheURL,
          utils,
          topologyFilters,
          trafficData,
          helmResourcesMap,
        )
      : null,
  });

export const TopologyDataController: React.FC<TopologyDataControllerProps> = ({
  namespace,
  render,
  application,
  cheURL,
  resourceList,
  serviceBinding,
  filters,
}) => {
  const [helmResourcesMap, setHelmResourcesMap] = React.useState<HelmReleaseResourcesMap>();
  const { resources, utils } = getResourceList(namespace, resourceList);
  if (serviceBinding) {
    resources.push({
      isList: true,
      kind: referenceForModel(ServiceBindingRequestModel),
      namespace,
      prop: 'serviceBindingRequests',
      optional: true,
    });
  }

  React.useEffect(() => {
    let ignore = false;

    const fetchHelmReleases = async () => {
      let releases: HelmRelease[];
      try {
        releases = await coFetchJSON(`/api/helm/releases?ns=${namespace}`);
      } catch {
        return;
      }
      if (ignore) return;

      const releaseResourcesMap = releases.reduce((acc, release) => {
        try {
          const manifestResources: K8sResourceKind[] = safeLoadAll(release.manifest);

          manifestResources.forEach((resource) => {
            const resourceKindName = getHelmReleaseKey(resource);
            if (!acc.hasOwnProperty(resourceKindName)) {
              acc[resourceKindName] = {
                releaseName: release.name,
                chartIcon: release.chart.metadata.icon,
                manifestResources,
              };
            }
          });
        } catch (e) {
          console.error(e);
        }

        return acc;
      }, {});

      setHelmResourcesMap(releaseResourcesMap);
    };

    fetchHelmReleases();

    return () => {
      ignore = true;
    };
  }, [namespace]);

  return (
    <Firehose resources={resources}>
      <Controller
        application={application}
        cheURL={cheURL}
        render={render}
        utils={utils}
        serviceBinding={serviceBinding}
        topologyFilters={filters}
        trafficData={trafficConnectorMock.elements}
        helmResourcesMap={helmResourcesMap}
      />
    </Firehose>
  );
};

const DataControllerStateToProps = (state: RootState) => {
  const resourceList = plugins.registry
    .getOverviewCRDs()
    .filter((resource) => state.FLAGS.get(resource.properties.required));
  const filters = getTopologyFilters(state);
  return { resourceList, filters };
};

export default connect(DataControllerStateToProps)(TopologyDataController);
