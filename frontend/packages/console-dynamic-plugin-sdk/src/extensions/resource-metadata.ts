import { ExtensionK8sGroupModel } from '../api/common-types';
import { Extension, ExtensionDeclaration } from '../types';

/** Customize the display of models by overriding values retrieved and generated through API discovery. */
export type ModelMetadata = ExtensionDeclaration<
  'console.resource-metadata',
  {
    /** The model to customize. May specify only a group, or optional version and kind. */
    model: ExtensionK8sGroupModel;
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
  }
>;

// Type guards

export const isModelMetadata = (e: Extension): e is ModelMetadata =>
  e.type === 'console.resource-metadata';
