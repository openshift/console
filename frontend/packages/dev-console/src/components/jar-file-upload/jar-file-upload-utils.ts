import { NavigateFunction } from 'react-router-dom';

export const jarFileUploadHandler = (file: File, namespace: string, navigate: NavigateFunction) => {
  navigate(`/upload-jar/ns/${namespace}`);
};
