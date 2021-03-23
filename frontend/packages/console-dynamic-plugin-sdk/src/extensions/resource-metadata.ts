import { Extension } from '@console/plugin-sdk/src/typings/base';

export namespace ExtensionProperties {
  /** Customize the display of models by overriding values retrieved and generated through API discovery. */
  export type ModelMetadata = {
    /** The model to customize. May specify only a group, or optional version and kind. */
    model: {
      group: string;
      version?: string;
      kind?: string;
    };

    /** Whether to consider this model reference as tech preview or dev preview. */
    badge?: 'tech' | 'dev';
    /** The color to associate to this model. */
    color?: string;
    /** Override the label. Requires `kind` be provided. */
    label?: string;
    /** Override the plural label. Requires `kind` be provided. */
    labelPlural?: string;
    /** Customize the abbreviation. Defaults to All uppercase chars in the kind up to 4 characters long. Requires `kind` be provided. */
    abbr?: string;
  };
}

// Extension types

export type ModelMetadata = Extension<ExtensionProperties.ModelMetadata> & {
  type: 'console.resource-metadata';
};

// Type guards

export const isModelMetadata = (e: Extension): e is ModelMetadata =>
  e.type === 'console.resource-metadata';
