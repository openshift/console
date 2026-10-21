import type { ExtensionK8sModel } from '../api/common-types';
import type { Extension, CodeRef } from '../types';

/** Properties of custom CreateResource component. */
export type CreateResourceComponentProps = { namespace?: string };

/** This extension allows plugins to provide a custom component (ie wizard or form) for specific resources,
    which will be rendered, when users try to create a new resource instance. */
export type CreateResource = Extension<
  'console.resource/create',
  {
    /** The model for which this create resource page will be rendered. */
    model: ExtensionK8sModel;
    /** The component to be rendered when the model matches */
    component: CodeRef<React.ComponentType<CreateResourceComponentProps>>;
  }
>;

// Type guards

export const isCreateResource = (e: Extension): e is CreateResource =>
  e.type === 'console.resource/create';
