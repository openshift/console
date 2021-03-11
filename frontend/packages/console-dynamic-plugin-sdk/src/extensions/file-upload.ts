import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';

namespace ExtensionProperties {
  export type FileUpload = {
    // array of file extensions supported
    fileExtensions: string[];
    // function which handles the file drop action
    handler: EncodedCodeRef;
  };

  export type FileUploadCodeRefs = {
    handler: CodeRef<FileUploadHandler>;
  };
}

export type ResolvedFileUpload = UpdateExtensionProperties<
  FileUpload,
  ExtensionProperties.FileUploadCodeRefs
>;

export type FileUpload = Extension<ExtensionProperties.FileUpload> & {
  type: 'console.file-upload';
};

export const isFileUpload = (e: Extension): e is ResolvedFileUpload =>
  e.type === 'console.file-upload';

export type FileUploadHandler = (file: File, namespace: string) => void;
