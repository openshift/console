import { CreateResource as CoreCreateResource } from '@openshift/dynamic-plugin-sdk';
import { Extension, ExtensionDeclaration } from '../types';

/** Properties of custom CreateResource component. */
export type CreateResourceComponentProps = { namespace?: string };

export type CreateResource = ExtensionDeclaration<
  'console.resource/create',
  CoreCreateResource['properties']
>;

// Type guards

export const isCreateResource = (e: Extension): e is CreateResource =>
  e.type === 'console.resource/create';
