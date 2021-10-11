import { ExtensionK8sKindVersionModel } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { K8sResourceCommon } from './console-types';

export type PageComponentProps<R extends K8sResourceCommon = K8sResourceCommon> = {
  filters?: any;
  selected?: any;
  match?: any;
  obj?: R;
  params?: any;
  customData?: any;
  showTitle?: boolean;
  fieldSelector?: string;
};

export type HorizontalNavTab = ExtensionDeclaration<
  'console.tab/horizontalNav',
  {
    /** The model for which this provider show tab. */
    model: ExtensionK8sKindVersionModel;
    /** The page to be show in horizontal tab. It takes tab name as name and href of the tab */
    page: {
      name: string;
      href: string;
    };
    /** The component to be rendered when the route matches. */
    component: CodeRef<React.ComponentType<PageComponentProps>>;
  }
>;

// Type Guards
export const isHorizontalNavTab = (e: Extension): e is HorizontalNavTab =>
  e.type === 'console.tab/horizontalNav';
