import { NavigateFunction } from 'react-router-dom-v5-compat';

export const jarFileUploadHandler = (file: File, namespace: string, navigate: NavigateFunction) => {
  navigate(`/upload-jar/ns/${namespace}`);
};
