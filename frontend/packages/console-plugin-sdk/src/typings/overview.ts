import { K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { OverviewDetailsResourcesTabProps } from '@console/internal/components/overview/resource-overview-page';
import { OverviewMainContentProps } from '@console/internal/components/overview';
import { Extension, LazyLoader } from './base';

type ResourceItem = {
  [key: string]: K8sResourceKind[];
};

namespace ExtensionProperties {
  export interface OverviewCRD {
    /** Resources list to be fetched from Firehose. */
    resources: (namespace: string) => FirehoseResource[];

    /** util to check get resources. */
    utils: (dc: K8sResourceKind, props: OverviewMainContentProps) => ResourceItem | undefined;
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
