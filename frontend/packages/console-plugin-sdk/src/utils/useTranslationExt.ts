import * as React from 'react';
import { TFunction } from 'i18next';
import { Namespace, useTranslation, UseTranslationOptions } from 'react-i18next';
import { isTranslatableString, getTranslationKey } from './extension-i18n';

/**
 * Extends i18next `useTranslation` hook and overrides the `t` function.
 *
 * Translatable strings in Console application must use the `%key%` pattern.
 */
const useTranslationExt = (ns?: Namespace, options?: UseTranslationOptions) => {
  const result = useTranslation(ns, options);
  const { t } = result;
  const cb: TFunction = React.useCallback(
    (value: string) => (isTranslatableString(value) ? t(getTranslationKey(value)) : value),
    [t],
  );
  return { ...result, t: cb };
};

export default useTranslationExt;
