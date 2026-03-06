import { createContext, useState, useMemo, useCallback } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import type { FileUpload } from '@console/dynamic-plugin-sdk';
import { isFileUpload, useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { useToast } from '@console/shared/src/components/toast';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { getRequiredFileUploadExtension } from './file-upload-utils';

export type FileUploadContextType = {
  extensions: string[];
  fileUpload: File;
  setFileUpload: (file: File) => void;
};

export const FileUploadContext = createContext<FileUploadContextType>({
  fileUpload: undefined,
  setFileUpload: () => {},
  extensions: [],
});

export const FileUploadContextProvider = FileUploadContext.Provider;

export const useValuesFileUploadContext = (): FileUploadContextType => {
  const { t } = useTranslation();
  const [fileUploadExtensions, resolved] = useResolvedExtensions<FileUpload>(isFileUpload);
  const toastContext = useToast();
  const [namespace] = useActiveNamespace();
  const navigate = useNavigate();
  const [file, setFile] = useState<File>(undefined);
  const fileExtensions = useMemo(
    () =>
      resolved
        ? _.flatten(fileUploadExtensions.map((e) => e.properties.fileExtensions)).map((ext) =>
            ext.toLowerCase(),
          )
        : [],
    [fileUploadExtensions, resolved],
  );

  const setFileUpload = useCallback(
    (f: File): void => {
      if (!f) {
        setFile(undefined);
      } else if (fileExtensions.length > 0) {
        const requiredFileExtension = getRequiredFileUploadExtension(fileUploadExtensions, f.name);
        if (requiredFileExtension) {
          setFile(f);
          const path = requiredFileExtension.properties.handler(f, namespace);
          if (path) {
            navigate(path);
          }
        } else {
          toastContext.addToast({
            variant: AlertVariant.warning,
            title: t('console-app~Incompatible file type'),
            content: t(
              'console-app~{{fileName}} cannot be uploaded. Only {{fileExtensions}} files are supported currently. Try another file.',
              {
                fileName: f.name,
                fileExtensions: fileExtensions.toString(),
              },
            ),
            timeout: true,
            dismissible: true,
          });
        }
      }
    },
    [setFile, fileExtensions, t, namespace, toastContext, fileUploadExtensions, navigate],
  );

  return {
    fileUpload: file,
    setFileUpload,
    extensions: fileExtensions,
  };
};
