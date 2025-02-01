import { getKubevirtComponentFactory } from './components/kubevirtComponentFactory';
import { isKubevirtResource } from './isKubevirtResource';
import { getKubevirtTopologyDataModel } from './kubevirt-data-transformer';

export const componentFactory = getKubevirtComponentFactory;
export const getDataModel = getKubevirtTopologyDataModel;
export const isResourceDepicted = isKubevirtResource;
