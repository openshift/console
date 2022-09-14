import { YAMLTemplate as CoreYAMLTemplate } from '@openshift/dynamic-plugin-sdk';
import { Extension, ExtensionDeclaration } from '../types';

/** YAML templates for editing resources via the yaml editor. */
export type YAMLTemplate = ExtensionDeclaration<
  'console.yaml-template',
  CoreYAMLTemplate['properties']
>;

// Type guards

export const isYAMLTemplate = (e: Extension): e is YAMLTemplate =>
  e.type === 'console.yaml-template';
