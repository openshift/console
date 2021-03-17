import { Extension } from '@console/plugin-sdk/src/typings/base';

namespace ExtensionProperties {
  export type YAMLTemplate = {
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
  };
}

// Extension types

export type YAMLTemplate = Extension<ExtensionProperties.YAMLTemplate> & {
  type: 'console.yaml-template';
};

// Type guards

export const isYAMLTemplate = (e: Extension): e is YAMLTemplate =>
  e.type === 'console.yaml-template';
