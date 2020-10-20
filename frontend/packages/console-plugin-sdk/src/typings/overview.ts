import { OverviewDetailsResourcesTabProps } from '@console/internal/components/overview/resource-overview-page';
import { Extension, LazyLoader } from './base';

namespace ExtensionProperties {
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
