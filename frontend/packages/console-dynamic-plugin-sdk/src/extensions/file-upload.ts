import type { To } from 'react-router-dom-v5-compat';
import type { Extension, CodeRef } from '../types';

/** This extension can be used to provide a handler for the file drop action on specific file extensions. */
export type FileUpload = Extension<
  'console.file-upload',
  {
    /** Supported file extensions. */
    fileExtensions: string[];
    /**
     * Function which handles the file drop action.
     * Can optionally return a path to navigate to after processing the file.
     * If a path is returned, the Console will navigate to that location using React Router.
     */
    handler: CodeRef<FileUploadHandler>;
  }
>;

// Type guards

export const isFileUpload = (e: Extension): e is FileUpload => e.type === 'console.file-upload';

// Support types

/**
 * Handler function for file upload operations.
 *
 * @param file - The file that was dropped/uploaded
 * @param namespace - The active namespace context
 * @returns Optional path to navigate to after handling the file. If returned, the Console will navigate to this path.
 */
export type FileUploadHandler = (file: File, namespace: string) => To | void;
