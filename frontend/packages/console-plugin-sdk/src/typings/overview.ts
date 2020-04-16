import { K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { OverviewDetailsResourcesTabProps } from '@console/internal/components/overview/resource-overview-page';
import { Extension, LazyLoader } from './base';

type ResourceItem = {
  [key: string]: K8sResourceKind[];
};

namespace ExtensionProperties {
  export interface OverviewCRD {
    /** Resources list to be fetched from Firehose. */
    resources: (namespace: string) => FirehoseResource[];
  }

  export interface OverviewResourceUtil {
    /** function to get derived resources */
    getResources: (obj: K8sResourceKind, props: any) => ResourceItem | undefined;
  }

  export interface OverviewResourceTab {
    /** The name of Overview tab to be updated. */
    name: string;

    /** Name of key to be checked in prop items. */
    key: string;

    /** Loader for the corresponding tab component. */
    loader: LazyLoader<OverviewDetailsResourcesTabProps>;
  }

  export interface OverviewTabSection {
    /** Name of key to be checked in prop items. */
    key: string;

    /** Loader for the corresponding tab component. */
    loader: LazyLoader<OverviewDetailsResourcesTabProps>;
  }
}

export interface OverviewCRD extends Extension<ExtensionProperties.OverviewCRD> {
  type: 'Overview/CRD';
}

export const isOverviewCRD = (e: Extension): e is OverviewCRD => {
  return e.type === 'Overview/CRD';
};

export interface OverviewResourceUtil extends Extension<ExtensionProperties.OverviewResourceUtil> {
  type: 'Overview/ResourceUtil';
}

export const isOverviewResourceUtil = (e: Extension): e is OverviewResourceUtil => {
  return e.type === 'Overview/ResourceUtil';
};

export interface OverviewResourceTab extends Extension<ExtensionProperties.OverviewResourceTab> {
  type: 'Overview/Resource';
}

export const isOverviewResourceTab = (e: Extension): e is OverviewResourceTab => {
  return e.type === 'Overview/Resource';
};

export interface OverviewTabSection extends Extension<ExtensionProperties.OverviewTabSection> {
  type: 'Overview/Section';
}

export const isOverviewTabSection = (e: Extension): e is OverviewTabSection => {
  return e.type === 'Overview/Section';
};
