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
import { transformTopologyData } from './data-transforms/data-transformer';
import { allowedResources, getHelmReleaseKey } from './topology-utils';
import { TopologyDataModel, TopologyDataResources, TrafficData } from './topology-types';
import { HelmReleaseResourcesMap } from '../helm/helm-types';
import { ALLOW_SERVICE_BINDING } from '../../const';

export interface RenderProps {
  data?: TopologyDataModel;
  namespace: string;
  loaded: boolean;
  loadError: string;
  serviceBinding: boolean;
}

interface StateProps {
  resourceList: plugins.OverviewCRD[];
  serviceBinding: boolean;
}

export interface ControllerProps {
  utils: Function[];
  loaded?: boolean;
  loadError?: any;
  namespace: string;
  resources?: TopologyDataResources;
  render(RenderProps): React.ReactElement;
  serviceBinding: boolean;
  trafficData?: TrafficData;
}

export interface TopologyDataControllerProps extends StateProps {
  namespace: string;
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
  const secretCount = React.useRef<number>(0);
  const [helmResourcesMap, setHelmResourcesMap] = React.useState<HelmReleaseResourcesMap>(null);

  React.useEffect(() => {
    const count = resources?.secrets?.data?.length ?? 0;
    if (count !== secretCount.current) {
      secretCount.current = count;
      if (count === 0) {
        setHelmResourcesMap({});
        return;
      }

      coFetchJSON(`/api/helm/releases?ns=${namespace}`)
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
                      chartIcon: release.chart.metadata.icon,
                      manifestResources,
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
    loaded: loaded && helmResourcesMap,
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
  namespace,
  render,
  resourceList,
  serviceBinding,
}) => {
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

const getServiceBindingStatus = ({ FLAGS }: RootState): boolean => FLAGS.get(ALLOW_SERVICE_BINDING);

const DataControllerStateToProps = (state: RootState) => {
  const resourceList = plugins.registry
    .getOverviewCRDs()
    .filter((resource) => state.FLAGS.get(resource.properties.required));
  return {
    resourceList,
    serviceBinding: getServiceBindingStatus(state),
  };
};

export default connect(DataControllerStateToProps)(TopologyDataController);
