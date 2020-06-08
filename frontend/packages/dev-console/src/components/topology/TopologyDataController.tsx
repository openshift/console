import * as React from 'react';
import { connect } from 'react-redux';
import { match as RMatch } from 'react-router';
import { Firehose } from '@console/internal/components/utils';
import { getResourceList } from '@console/shared';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux-types';
import { safeLoadAll } from 'js-yaml';
import { ServiceBindingRequestModel } from '../../models';
import { transformTopologyData } from './data-transforms/data-transformer';
import { allowedResources, getHelmReleaseKey, getServiceBindingStatus } from './topology-utils';
import { TopologyDataModel, TopologyDataResources, TrafficData } from './topology-types';
import { HelmReleaseResourcesMap } from '../helm/helm-types';
import { fetchHelmReleases } from '../helm/helm-utils';
import { isOverviewCRD, useExtensions, OverviewCRD } from '@console/internal/plugins';

export interface RenderProps {
  data?: TopologyDataModel;
  namespace: string;
  loaded: boolean;
  loadError: string;
  serviceBinding: boolean;
}

interface StateProps {
  serviceBinding: boolean;
}

export interface ControllerProps {
  utils: Function[];
  loaded?: boolean;
  loadError?: any;
  resources?: TopologyDataResources;
  render(props: RenderProps): React.ReactElement;
  namespace: string;
  serviceBinding: boolean;
  trafficData?: TrafficData;
}

export interface TopologyDataControllerProps extends StateProps {
  match: RMatch<{
    name?: string;
  }>;
  render(RenderProps): React.ReactElement;
}

const Controller: React.FC<ControllerProps> = ({
  render,
  resources,
  loaded,
  loadError,
  utils,
  namespace,
  serviceBinding,
  trafficData,
}) => {
  const secretCount = React.useRef<number>(-1);
  const [helmResourcesMap, setHelmResourcesMap] = React.useState<HelmReleaseResourcesMap>(null);
  React.useEffect(() => {
    const count = resources?.secrets?.data?.length ?? 0;
    if (
      (resources.secrets?.loaded && count !== secretCount.current) ||
      resources.secrets?.loadError
    ) {
      secretCount.current = count;
      if (count === 0) {
        setHelmResourcesMap({});
        return;
      }

      fetchHelmReleases(namespace)
        .then((releases) => {
          setHelmResourcesMap(
            releases.reduce((acc, release) => {
              try {
                const manifestResources: K8sResourceKind[] = safeLoadAll(release.manifest);
                manifestResources.forEach((resource) => {
                  const resourceKindName = getHelmReleaseKey(resource);
                  if (!acc.hasOwnProperty(resourceKindName)) {
                    acc[resourceKindName] = {
                      releaseName: release.name,
                      releaseVersion: release.version,
                      chartIcon: release.chart.metadata.icon,
                      manifestResources,
                      releaseNotes: release.info.notes,
                    };
                  }
                });
              } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
              }
              return acc;
            }, {}),
          );
        })
        .catch(() => {
          setHelmResourcesMap({});
        });
    }
  }, [namespace, resources, resources.secrets, secretCount, setHelmResourcesMap]);

  return render({
    loaded: loaded && !!helmResourcesMap,
    loadError,
    namespace,
    serviceBinding,
    data:
      loaded && helmResourcesMap
        ? transformTopologyData(resources, allowedResources, utils, trafficData, helmResourcesMap)
        : null,
  });
};

export const TopologyDataController: React.FC<TopologyDataControllerProps> = ({
  match,
  render,
  serviceBinding,
}) => {
  const resourceListExtensions = useExtensions<OverviewCRD>(isOverviewCRD);
  const namespace = match.params.name;
  const { resources, utils } = getResourceList(namespace, resourceListExtensions);
  if (serviceBinding) {
    resources.push({
      isList: true,
      kind: referenceForModel(ServiceBindingRequestModel),
      namespace,
      prop: 'serviceBindingRequests',
      optional: true,
    });
  }

  return (
    <Firehose resources={resources}>
      <Controller
        render={render}
        utils={utils}
        serviceBinding={serviceBinding}
        namespace={namespace}
      />
    </Firehose>
  );
};

const DataControllerStateToProps = (state: RootState) => ({
  serviceBinding: getServiceBindingStatus(state),
});

export default connect(DataControllerStateToProps)(TopologyDataController);
