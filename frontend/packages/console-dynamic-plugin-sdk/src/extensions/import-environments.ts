import type { Extension } from '../types';

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

/** This extension can be used to specify extra build environment variable fields under the builder image selector
    in the dev console git import form. When set, the fields will override environment variables
    of the same name in the build section. */
export type ImportEnvironment = Extension<
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
