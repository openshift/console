import { CreateResource as CoreCreateResource } from '@openshift/dynamic-plugin-sdk';
import { Extension } from '../types';
import { RepackageExtension } from './data-types';

/** Properties of custom CreateResource component. */
export type CreateResourceComponentProps = { namespace?: string };

export type CreateResource = RepackageExtension<'console.resource/create', CoreCreateResource>;

// Type guards

export const isCreateResource = (e: Extension): e is CreateResource =>
  e.type === 'console.resource/create';
