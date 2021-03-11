import { history } from '@console/internal/components/utils/router';

export const jarFileUploadHandler = (file: File, namespace: string) => {
  history.push(`/upload-jar/ns/${namespace}`);
};
