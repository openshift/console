import { k8sGet } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { BindableServicesModel } from './models';
import { BindableServiceGVK, BindableServicesKind } from './types';

type BindableServicesData = {
  bindableServices: BindableServiceGVK[];
  loaded: boolean;
};

const bindableServicesData: BindableServicesData = {
  bindableServices: [],
  loaded: false,
};

export const fetchBindableServices = async (): Promise<BindableServiceGVK[]> => {
  bindableServicesData.loaded = false;
  try {
    const bindableService: BindableServicesKind = await k8sGet(
      BindableServicesModel,
      'bindable-kinds',
    );
    bindableServicesData.bindableServices = bindableService.status ?? [];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Error fetching bindable services', err);
    bindableServicesData.bindableServices = [];
  }
  bindableServicesData.loaded = true;
  return bindableServicesData.bindableServices;
};

export const getBindableServicesList = () => {
  return bindableServicesData.bindableServices;
};
