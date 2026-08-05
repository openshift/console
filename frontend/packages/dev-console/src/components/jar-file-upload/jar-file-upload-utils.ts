import type { FileUploadHandler } from '@console/dynamic-plugin-sdk';

export const jarFileUploadHandler: FileUploadHandler = (file, namespace) =>
  `/upload-jar/ns/${namespace}`;
