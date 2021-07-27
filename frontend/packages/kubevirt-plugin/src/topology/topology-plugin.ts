import { getKubevirtComponentFactory } from './components/kubevirtComponentFactory';
import { isKubevirtResource } from './isKubevirtResource';
import { getKubevirtTopologyDataModel } from './kubevirt-data-transformer';
import TopologyVmPanel from './TopologyVmPanel';

export const componentFactory = getKubevirtComponentFactory;
export const getDataModel = getKubevirtTopologyDataModel;
export const isResourceDepicted = isKubevirtResource;
export const TopologyVmPanelComponent = TopologyVmPanel;
