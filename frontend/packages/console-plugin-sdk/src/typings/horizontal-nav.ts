import { PageComponentProps, Page } from '@console/internal/components/utils/horizontal-nav';
import { K8sKind } from '@console/internal/module/k8s';
import { Extension, LazyLoader } from './base';

namespace ExtensionProperties {
  export interface HorizontalNavTab {
    model: K8sKind;
    page: Pick<Page, 'name' | 'href' | 'path'>;
    loader: LazyLoader<PageComponentProps>;
  }
}

export interface HorizontalNavTab extends Extension<ExtensionProperties.HorizontalNavTab> {
  type: 'HorizontalNavTab';
}

export const isHorizontalNavTab = (e: Extension): e is HorizontalNavTab => {
  return e.type === 'HorizontalNavTab';
};
