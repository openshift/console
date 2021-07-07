import { ExtensionK8sModel } from '../api/common-types';
import { CodeRef, Extension, ExtensionDeclaration } from '../types';

export type CreateResource = ExtensionDeclaration<
  'console.resource/create',
  {
    /** The model for which this create resource page will be rendered. */
    model: ExtensionK8sModel;
    /** The component to be rendered when the model matches */
    component: CodeRef<React.ComponentType<{ namespace?: string }>>;
  }
>;

// Type guards

export const isCreateResource = (e: Extension): e is CreateResource =>
  e.type === 'console.resource/create';
