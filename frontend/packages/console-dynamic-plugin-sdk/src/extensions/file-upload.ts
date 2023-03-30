import { Extension, ExtensionDeclaration, CodeRef } from '../types';

/** This extension can be used to provide a handler for the file drop action on specific file extensions. */
export type FileUpload = ExtensionDeclaration<
  'console.file-upload',
  {
    /** Supported file extensions. */
    fileExtensions: string[];
    /** Function which handles the file drop action. */
    handler: CodeRef<FileUploadHandler>;
  }
>;

// Type guards

export const isFileUpload = (e: Extension): e is FileUpload => e.type === 'console.file-upload';

// Support types

export type FileUploadHandler = (file: File, namespace: string) => void;
