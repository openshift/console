import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const useErrorTranslation = (): [
  string,
  React.Dispatch<string>,
  React.Dispatch<string>,
  VoidFunction,
] => {
  const { t } = useTranslation();
  const [errorMsg, setErrorMsg] = React.useState<string>();
  const [errorMsgKey, setErrorMsgKey] = React.useState<string>();
  const resetError = React.useCallback(() => {
    setErrorMsg(null);
    setErrorMsgKey(null);
  }, []);

  return [errorMsgKey ? t(errorMsgKey) : errorMsg, setErrorMsg, setErrorMsgKey, resetError];
};
