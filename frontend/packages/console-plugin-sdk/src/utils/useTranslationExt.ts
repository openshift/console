import * as React from 'react';
import { TFunction } from 'i18next';
import { Namespace, useTranslation, UseTranslationOptions } from 'react-i18next';
import { isTranslatableString } from './extension-i18n';

// translates strings if the key matches the pattern `%...%`

// extend react-i18next useTranslation and override the `t` function
const useTranslationExt = (ns?: Namespace, options?: UseTranslationOptions) => {
  const result = useTranslation(ns, options);
  const { t } = result;
  const cb: TFunction = React.useCallback(
    (key: string) => (isTranslatableString(key) ? t(key.substr(1, key.length - 2)) : key),
    [t],
  );
  return { ...result, t: cb };
};

export default useTranslationExt;
