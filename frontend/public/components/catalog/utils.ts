import * as _ from 'lodash';
import { FilterItem, Item } from './types';
import { normalizeIconClass } from './catalog-item-icon';
import * as catalogImg from '../../imgs/logos/catalog-icon.svg';

type TypeFilters = {
  ClusterServiceVersion: FilterItem;
  HelmChart: FilterItem;
  ImageStream: FilterItem;
  Template: FilterItem;
  ClusterServiceClass: FilterItem;
};

type CapabilityFilters = {
  BasicInstall: FilterItem;
  SeamlessUpgrades: FilterItem;
  FullLifecycle: FilterItem;
  DeepInsights: FilterItem;
  AutoPilot: FilterItem;
};

type PageFilters = {
  kind: TypeFilters;
  capabilityLevel: CapabilityFilters;
};

// initialFilters cannot be typed as it has multiple usages
export const getAvailableFilters = (initialFilters): PageFilters => {
  const filters: PageFilters = _.cloneDeep(initialFilters);
  filters.kind = {
    ClusterServiceVersion: {
      label: 'Operator Backed',
      value: 'InstalledOperator',
      active: true,
    },
    HelmChart: {
      label: 'Helm Charts',
      value: 'HelmChart',
      active: false,
    },
    ImageStream: {
      label: 'Builder Image',
      value: 'ImageStream',
      active: false,
    },
    Template: {
      label: 'Template',
      value: 'Template',
      active: false,
    },
    ClusterServiceClass: {
      label: 'Service Class',
      value: 'ClusterServiceClass',
      active: false,
    },
  };

  return filters;
};

export const getIconProps = (item: Item) => {
  const { tileImgUrl, tileIconClass } = item;
  if (tileImgUrl) {
    return { iconImg: tileImgUrl, iconClass: null };
  } else if (tileIconClass) {
    return { iconImg: null, iconClass: normalizeIconClass(tileIconClass) };
  }
  return { iconImg: catalogImg, iconClass: null };
};
