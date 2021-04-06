import { Extension, ExtensionDeclaration } from '../types';

export type YAMLTemplate = ExtensionDeclaration<
  'console.yaml-template',
  {
    /** Model associated with the template. */
    model: {
      group: string;
      version: string;
      kind: string;
    };
    /** The YAML template. */
    template: string;
    /** The name of the template. Use the name `default` to mark this as the default template. */
    name: string | 'default';
  }
>;

// Type guards

export const isYAMLTemplate = (e: Extension): e is YAMLTemplate =>
  e.type === 'console.yaml-template';
