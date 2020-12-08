import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const useErrorTranslation = (): [
  React.ReactNode,
  React.Dispatch<React.ReactNode>,
  React.Dispatch<string>,
  VoidFunction,
] => {
  const { t } = useTranslation();
  const [errorMsg, setErrorMsg] = React.useState<React.ReactNode>();
  const [errorMsgKey, setErrorMsgKey] = React.useState<string>();
  const resetError = React.useCallback(() => {
    setErrorMsg(null);
    setErrorMsgKey(null);
  }, []);

  return [errorMsgKey ? t(errorMsgKey) : errorMsg, setErrorMsg, setErrorMsgKey, resetError];
};
