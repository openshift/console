import { YAMLTemplate as CoreYAMLTemplate } from '@openshift/dynamic-plugin-sdk';
import { Extension } from '../types';
import { RepackageExtension } from './data-types';

/** YAML templates for editing resources via the yaml editor. */
export type YAMLTemplate = RepackageExtension<'console.yaml-template', CoreYAMLTemplate>;

// Type guards

export const isYAMLTemplate = (e: Extension): e is YAMLTemplate =>
  e.type === 'console.yaml-template';
