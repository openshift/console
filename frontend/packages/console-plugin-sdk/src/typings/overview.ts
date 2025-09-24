import { OverviewItem } from '@console/shared/src/types/resource';
import { Extension, LazyLoader } from './base';

export type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

namespace ExtensionProperties {
  export interface OverviewResourceTab {
    /** The name of Overview tab to be updated. */
    name: string;

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
