import * as React from 'react';
import { QuickStart, getDisabledQuickStarts } from '@patternfly/quickstarts';
import { useTranslation } from 'react-i18next';
import {
  WatchK8sResult,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { QuickStartModel } from '../../../models';

const LOCALIZATION_NAME_LABEL = 'console.openshift.io/name';
const LOCALIZATION_LANGUAGE_LABEL = 'console.openshift.io/lang';
const LOCALIZATION_COUNTRY_LABEL = 'console.openshift.io/country';

export const getQuickStartNameRef = (quickStart: QuickStart) =>
  quickStart.metadata.labels?.[LOCALIZATION_NAME_LABEL] ||
  quickStart.metadata.annotations?.[LOCALIZATION_NAME_LABEL] ||
  quickStart.metadata.name;

export const groupQuickStartsByName = (quickStarts: QuickStart[]) => {
  return quickStarts.reduce<Record<string, QuickStart[]>>((grouped, quickStart) => {
    const name = getQuickStartNameRef(quickStart);
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(quickStart);
    return grouped;
  }, {});
};

/**
 * Returns the QuickStart with the best localization match, for the given
 * preferred language and preferred country. It prefers a match in this order:
 *
 * 1. QuickStart language and country are equal to the preferred language and country.
 *    This includes sample without language (fallbacks to en) and no country.
 *
 * 2. QuickStart language is equal to the preferred language.
 *    1. And the quick starts has no country defined.  (eg, select en quick starts is used for en-CA and en-GB)
 *    2. Any country is defined.                       (eg, select en-CA quick starts is used for en-GB)
 *
 * 3. Fallback to an english quick starts
 *    (QuickStart language is en OR quick starts language is not defined):
 *    1. Same country  (use en-CA quick starts if preference is fr-CA)
 *    2. No country
 *    3. Any country   (use en-CA quick starts if preference is en-US)
 */
export const getBestMatch = (quickStarts: QuickStart[], language: string): QuickStart | null => {
  if (!quickStarts || !quickStarts.length) {
    return null;
  }
  const preferredLanguage = (language || 'en').split('-')[0].toLowerCase();
  const preferredCountry = ((language || '').split('-')[1] || '').toUpperCase();

  let sameLanguageWithoutCountry: QuickStart = null;
  let sameLanguageWithAnyCountry: QuickStart = null;
  let fallbackLanguageSameCountry: QuickStart = null;
  let fallbackLanguageNoCountry: QuickStart = null;
  let fallbackLanguageAnyCountry: QuickStart = null;

  for (const quickStart of quickStarts) {
    const quickStartLanguage = (
      quickStart.metadata?.labels?.[LOCALIZATION_LANGUAGE_LABEL] || 'en'
    ).toLowerCase();
    const quickStartCountry = (
      quickStart.metadata?.labels?.[LOCALIZATION_COUNTRY_LABEL] || ''
    ).toUpperCase();

    if (quickStartLanguage === preferredLanguage && quickStartCountry === preferredCountry) {
      return quickStart;
    }
    if (quickStartLanguage === preferredLanguage) {
      if (!quickStartCountry && !sameLanguageWithoutCountry) {
        sameLanguageWithoutCountry = quickStart;
      } else if (quickStartCountry && !sameLanguageWithAnyCountry) {
        sameLanguageWithAnyCountry = quickStart;
      }
    }
    if (quickStartLanguage === 'en') {
      if (quickStartCountry === preferredCountry && !fallbackLanguageSameCountry) {
        fallbackLanguageSameCountry = quickStart;
      } else if (!quickStartCountry && !fallbackLanguageNoCountry) {
        fallbackLanguageNoCountry = quickStart;
      } else if (!fallbackLanguageAnyCountry) {
        fallbackLanguageAnyCountry = quickStart;
      }
    }
  }
  return (
    sameLanguageWithoutCountry ||
    sameLanguageWithAnyCountry ||
    fallbackLanguageSameCountry ||
    fallbackLanguageNoCountry ||
    fallbackLanguageAnyCountry
  );
};

export const useQuickStarts = (filterDisabledQuickStarts = true): WatchK8sResult<QuickStart[]> => {
  const preferredLanguage = useTranslation().i18n.language;

  const [quickStarts, quickStartsLoaded, quickStartsError] = useK8sWatchResource<QuickStart[]>({
    groupVersionKind: getGroupVersionKindForModel(QuickStartModel),
    isList: true,
  });

  const bestMatchQuickStarts = React.useMemo(() => {
    if (!quickStartsLoaded) {
      return [];
    }
    const groupedQuickStarts = groupQuickStartsByName(quickStarts);

    if (filterDisabledQuickStarts) {
      const disabledQuickStarts = getDisabledQuickStarts();
      disabledQuickStarts.forEach((quickStartName) => delete groupedQuickStarts[quickStartName]);
    }

    return Object.values(groupedQuickStarts).map((quickStartsByName) =>
      getBestMatch(quickStartsByName, preferredLanguage),
    );
  }, [quickStarts, quickStartsLoaded, filterDisabledQuickStarts, preferredLanguage]);

  return [bestMatchQuickStarts, quickStartsLoaded, quickStartsError];
};
