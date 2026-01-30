export const jarFileUploadHandler = (file: File, namespace: string): string => {
  return `/upload-jar/ns/${namespace}`;
};
