import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { Link } from 'react-router-dom';
import {
  AdapterDataType,
  K8sResourceCommon,
  NetworkAdapterType,
  PodsAdapterDataType,
} from '@console/dynamic-plugin-sdk/src';
import { ResourceIcon, resourcePathFromModel } from '@console/internal/components/utils';
import { getResource } from '@console/topology/src/utils';
import { VirtualMachineModel } from '../models';
import { getKubevirtAvailableModel } from '../models/kubevirtReferenceForModel';
import { usePodsForVm } from '../utils/usePodsForVm';
import { TYPE_VIRTUAL_MACHINE } from './components/const';
import { TopologyVmDetailsPanel } from './TopologyVmDetailsPanel';
import { VMNode } from './types';

export const getVmSidePanelDetailsTabSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_VIRTUAL_MACHINE) return undefined;
  return <TopologyVmDetailsPanel vmNode={element as VMNode} />;
};

const usePodsAdapterForVm = (resource: K8sResourceCommon): PodsAdapterDataType => {
  const { podData: { pods = [] } = {}, loaded, loadError } = usePodsForVm(resource);
  return { pods, loaded, loadError };
};

export const getVmSidePanelPodsAdapter = (
  element: GraphElement,
): AdapterDataType<PodsAdapterDataType> => {
  if (element.getType() !== TYPE_VIRTUAL_MACHINE) return undefined;
  const resource = getResource(element);
  return { resource, provider: usePodsAdapterForVm };
};

export const getVmSidePanelNetworkAdapter = (element: GraphElement): NetworkAdapterType => {
  if (element.getType() !== TYPE_VIRTUAL_MACHINE) return undefined;
  const resource = getResource(element);
  return { resource };
};

export const getVmSideBarResourceLink = (element: GraphElement) => {
  if (element.getType() !== TYPE_VIRTUAL_MACHINE) return undefined;
  const name = element.getLabel();
  const resource = getResource(element);
  return (
    <>
      <ResourceIcon className="co-m-resource-icon--lg" kind={resource.kind} />
      {name && (
        <Link
          to={resourcePathFromModel(
            getKubevirtAvailableModel(VirtualMachineModel),
            name,
            resource.metadata.namespace,
          )}
          className="co-resource-item__resource-name"
        >
          {name}
        </Link>
      )}
    </>
  );
};
