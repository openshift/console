import { getKubevirtComponentFactory } from './components/kubevirtComponentFactory';
import { isKubevirtResource } from './isKubevirtResource';
import { getKubevirtTopologyDataModel, useKubevirtResources } from './kubevirt-data-transformer';

export const componentFactory = getKubevirtComponentFactory;
export const getDataModel = getKubevirtTopologyDataModel;
export const useResources = useKubevirtResources;
export const isResourceDepicted = isKubevirtResource;
