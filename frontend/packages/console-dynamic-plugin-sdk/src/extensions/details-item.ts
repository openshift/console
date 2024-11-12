import { ExtensionK8sModel } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { K8sResourceCommon } from './console-types';

export type DetailsItemColumn = 'right' | 'left';

export type DetailsItemComponentProps<R extends K8sResourceCommon = K8sResourceCommon, V = any> = {
  /** The subject resource */
  obj: R;

  /** The path property provided by the extension */
  path?: string;

  /** The property of obj referenced by path */
  value?: V;
};

/** Adds a new details item to the default resource summary on the details page. */
export type DetailsItem = ExtensionDeclaration<
  'console.resource/details-item',
  {
    /** The subject resource's API group, version, and kind. */
    model: ExtensionK8sModel;

    /** A unique identifier. */
    id: string;

    /**
     * Determines if the item will appear in the 'left' or 'right' column of the resource summary on
     * the details page. Default: 'right'
     */
    column: DetailsItemColumn;

    /** The details item title. */
    title: string;

    /**
     * An optional description that will appear in the title popover.
     */
    description?: string;

    /**
     * An optional, fully-qualified path to a resource property to used as the details item
     * value. Only [primitive type](https://developer.mozilla.org/en-US/docs/Glossary/Primitive)
     * values can be rendered directly. Use the component property to handle other data types.
     */
    path?: string;

    /**
     * An optional React component that will render the details item value.
     */
    component?: CodeRef<React.ComponentType<DetailsItemComponentProps>>;

    /**
     * An optional sort weight, relative to all other details items in the same column. Represented
     * by any valid [JavaScript
     * Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type).
     * Items in each column are sorted independently, lowest to highest. Items without sort weights
     * are sorted after items with sort weights.
     */
    sortWeight?: number;
  }
>;

export const isDetailsItem = (e: Extension): e is DetailsItem =>
  e.type === 'console.resource/details-item';

export const isLeftDetailsItem = (e: DetailsItem): e is DetailsItem =>
  isDetailsItem(e) && e.properties.column === 'left';

export const isRightDetailsItem = (e: DetailsItem): e is DetailsItem =>
  isDetailsItem(e) && e.properties.column === 'right';
