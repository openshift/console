import { Extension, ExtensionDeclaration } from '../types';

export type ImageEnvironment = {
  /** Environment variable key */
  key: string;
  /** The input field's label */
  label: string;
  /** Default value to use as a placeholder */
  defaultValue?: string;
  /** Description of the environment variable */
  description?: string;
};

export type ImportEnvironment = ExtensionDeclaration<
  'dev-console.import/environment',
  {
    /** Name of the image stream to provide custom environment variables for */
    imageStreamName: string;
    /** List of supported image stream tags */
    imageStreamTags: string[];
    /** List of environment variables */
    environments: ImageEnvironment[];
  }
>;

// Type guards

export const isImportEnvironment = (e: Extension): e is ImportEnvironment => {
  return e.type === 'dev-console.import/environment';
};
