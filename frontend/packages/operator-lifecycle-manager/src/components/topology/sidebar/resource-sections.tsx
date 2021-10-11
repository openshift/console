import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { TopologyDataObject } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { TYPE_OPERATOR_BACKED_SERVICE } from '@console/topology/src/operators/components/const';
import { ClusterServiceVersionModel } from '../../../models';
import { ClusterServiceVersionKind } from '../../../types';
import TopologyOperatorBackedResources from './TopologyOperatorBackedResources';
import { OperatorGroupData } from './types';

const ResourceSection: React.FC<{ item: TopologyDataObject<OperatorGroupData> }> = ({ item }) => {
  const { resource, data } = item;
  const { namespace } = resource.metadata;
  const { csvName } = data;

  const resourcesList = React.useMemo(() => {
    return {
      csv: {
        kind: referenceForModel(ClusterServiceVersionModel),
        name: csvName,
        namespace,
        isList: false,
      },
    };
  }, [csvName, namespace]);

  const resources = useK8sWatchResources(resourcesList);

  return (
    <StatusBox
      data={resources.csv.data}
      loaded={resources.csv.loaded}
      loadError={resources.csv.loadError}
      label="Operator Resources"
    >
      <TopologyOperatorBackedResources
        item={item}
        csv={resources.csv.data as ClusterServiceVersionKind}
      />
    </StatusBox>
  );
};

export const getOperatorBackedPanelResourceSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_OPERATOR_BACKED_SERVICE) return undefined;
  return <ResourceSection item={element.getData()} />;
};
