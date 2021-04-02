import { ResolvedExtension, FileUpload } from '@console/dynamic-plugin-sdk';

export const getFileType = (fileName: string): string => {
  if (fileName.lastIndexOf('.') === -1) {
    return null;
  }
  return fileName.split('.').pop();
};

export const isFileSupported = (fileName: string, supportedFileTypes: string[]): boolean => {
  const extension = getFileType(fileName);
  if (!extension || extension.length === 0) {
    return false;
  }
  return supportedFileTypes.includes(extension.toLowerCase());
};

export const getRequiredFileUploadExtension = (
  fileUploadExtensions: ResolvedExtension<FileUpload>[],
  fileName: string,
) =>
  fileUploadExtensions.find((ex) => isFileSupported(fileName, ex.properties.fileExtensions)) ??
  null;
