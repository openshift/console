import { ExtensionK8sModel } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { K8sResourceCommon } from './console-types';

export type DetailsItemColumn = 'right' | 'left';

export type DetailsItemComponentProps<R extends K8sResourceCommon = K8sResourceCommon> = {
  /** The resource for which details are being rendered. */
  obj: R;
};

/** Adds a new details item to the details page resource summary. */
export type DetailsItem = ExtensionDeclaration<
  'console.resource/details-item',
  {
    /** The resource kind to which the details item applies. */
    model: ExtensionK8sModel;

    /** A unique details item identifier. */
    id: string;

    /**
     * Determines if the item will appear in the left or right column of the details page resource
     * summary.
     * @defaultValue 'right'
     */
    column: DetailsItemColumn;

    /** The title of the details item. */
    title: string;

    /**
     * The fully qualified path to a string-type property on the resource, which will be rendered
     * as the details item value.
     * @example 'spec.template.spec.containers[0].image'
     */
    path?: string;

    /**
     * The component to be rendered as the details item value. This takes precedence over the
     * `path` property.
     */
    component?: CodeRef<React.ComponentType<DetailsItemComponentProps>>;

    /**
     * The weight of the details item relative to other items in the same column, represented by any
     * valid
     * [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type).
     * Lower values will appear higher in the column.
     * @defaultValue Infinity (i.e. the item will appear at the bottom of the column)
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
