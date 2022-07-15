import { ModelMetadata as CoreModelMetadata } from '@openshift/dynamic-plugin-sdk';
import { Extension } from '../types';
import { RepackageExtension } from './data-types';

export enum ModelBadge {
  DEV = 'dev',
  TECH = 'tech',
}

/** Customize the display of models by overriding values retrieved and generated through API discovery. */
export type ModelMetadata = RepackageExtension<'console.model-metadata', CoreModelMetadata>;

// Type guards

export const isModelMetadata = (e: Extension): e is ModelMetadata =>
  e.type === 'console.model-metadata';
