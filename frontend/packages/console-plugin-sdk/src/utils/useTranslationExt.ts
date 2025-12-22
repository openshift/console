import { useCallback } from 'react';
import { Namespace } from 'i18next';
import { useTranslation, UseTranslationOptions } from 'react-i18next';
import { isTranslatableString, getTranslationKey } from './extension-i18n';

/**
 * Extends i18next `useTranslation` hook and overrides the `t` function.
 *
 * Translatable strings in Console application must use the `%key%` pattern.
 */
const useTranslationExt = (ns?: Namespace, options?: UseTranslationOptions<undefined>) => {
  const result = useTranslation(ns, options);
  const { t } = result;
  const cb = useCallback(
    (value: string) => (isTranslatableString(value) ? t(getTranslationKey(value)) : value),
    [t],
  );
  return { ...result, t: cb };
};

export default useTranslationExt;
