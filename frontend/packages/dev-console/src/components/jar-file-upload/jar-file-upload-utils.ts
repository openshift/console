import type { FileUploadHandler } from '@console/dynamic-plugin-sdk';

export const jarFileUploadHandler: FileUploadHandler = (file, namespace) => {
  return `/upload-jar/ns/${namespace}`;
};
