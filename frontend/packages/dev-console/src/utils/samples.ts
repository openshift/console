import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { k8sGetResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleSampleModel } from '../models/samples';
import {
  ConsoleSample,
  ConsoleSampleGitImportSourceRepository,
  isContainerImportSource,
  isGitImportSource,
} from '../types/samples';

const LOCALIZATION_NAME_LABEL = 'console.openshift.io/name';
const LOCALIZATION_LANGUAGE_LABEL = 'console.openshift.io/lang';
const LOCALIZATION_COUNTRY_LABEL = 'console.openshift.io/country';

export const createSampleLink = (sample: ConsoleSample, activeNamespace: string): string | null => {
  if (isGitImportSource(sample.spec.source)) {
    const { gitImport } = sample.spec.source;
    const searchParams = new URLSearchParams();
    searchParams.set('formType', 'sample');
    searchParams.set('sample', sample.metadata.name);
    searchParams.set('git.repository', gitImport.repository.url);
    if (gitImport.repository.revision) {
      searchParams.set('git.revision', gitImport.repository.revision);
    }
    if (gitImport.repository.contextDir) {
      searchParams.set('git.contextDir', gitImport.repository.contextDir);
    }
    return `/import/ns/${activeNamespace}?${searchParams}`;
  }

  if (isContainerImportSource(sample.spec.source)) {
    const { containerImport } = sample.spec.source;
    const searchParams = new URLSearchParams();
    searchParams.set('sample', sample.metadata.name);
    searchParams.set('image', containerImport.image);
    return `/deploy-image/ns/${activeNamespace}?${searchParams}`;
  }

  // Unsupported source type, will be dropped.
  return null;
};

export const getGitImportSample = (): {
  sampleName: string;
  repository: ConsoleSampleGitImportSourceRepository;
} => {
  const searchParams = new URLSearchParams(window.location.search);
  return {
    sampleName: searchParams.get('sample'),
    repository: {
      url: searchParams.get('git.repository'),
      revision: searchParams.get('git.revision'),
      contextDir: searchParams.get('git.contextDir'),
    },
  };
};

export const getContainerImportSample = () => {
  const searchParams = new URLSearchParams(window.location.search);
  return {
    sampleName: searchParams.get('sample'),
    image: searchParams.get('image'),
  };
};

export const hasSampleQueryParameter = () => {
  return !!new URLSearchParams(window.location.search).get('sample');
};

export const groupConsoleSamplesByName = (samples: ConsoleSample[]) => {
  return samples.reduce<Record<string, ConsoleSample[]>>((grouped, consoleSample) => {
    const name =
      consoleSample.metadata.labels?.[LOCALIZATION_NAME_LABEL] || consoleSample.metadata.name;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(consoleSample);
    return grouped;
  }, {});
};

/**
 * Returns the samples with the best localization match, for the given
 * preferred language and preferred country. It prefers a match in this order:
 *
 * 1. Sample language and country are equal to the preferred language and country.
 *    This includes sample without language (fallbacks to en) and no country.
 *
 * 2. Sample language is equal to the preferred language.
 *    1. And the sample has no country defined.  (eg, select en sample is used for en-CA and en-GB)
 *    2. Any country is defined.                 (eg, select en-CA sample is used for en-GB)
 *
 * 3. Fallback to an english sample
 *    (Sample language is en OR sample language is not defined):
 *    1. Same country  (use en-CA sample if preference is fr-CA)
 *    2. No country
 *    3. Any country   (use en-CA sample if preference is en-US)
 */
export const getBestMatch = (samples: ConsoleSample[], language: string): ConsoleSample | null => {
  if (!samples || !samples.length) {
    return null;
  }
  const preferredLanguage = (language || 'en').split('-')[0].toLowerCase();
  const preferredCountry = ((language || '').split('-')[1] || '').toUpperCase();

  let sameLanguageWithoutCountry: ConsoleSample = null;
  let sameLanguageWithAnyCountry: ConsoleSample = null;
  let fallbackLanguageSameCountry: ConsoleSample = null;
  let fallbackLanguageNoCountry: ConsoleSample = null;
  let fallbackLanguageAnyCountry: ConsoleSample = null;

  for (const sample of samples) {
    const sampleLanguage = (
      sample.metadata?.labels?.[LOCALIZATION_LANGUAGE_LABEL] || 'en'
    ).toLowerCase();
    const sampleCountry = (
      sample.metadata?.labels?.[LOCALIZATION_COUNTRY_LABEL] || ''
    ).toUpperCase();

    if (sampleLanguage === preferredLanguage && sampleCountry === preferredCountry) {
      return sample;
    }
    if (sampleLanguage === preferredLanguage) {
      if (!sampleCountry && !sameLanguageWithoutCountry) {
        sameLanguageWithoutCountry = sample;
      } else if (sampleCountry && !sameLanguageWithAnyCountry) {
        sameLanguageWithAnyCountry = sample;
      }
    }
    if (sampleLanguage === 'en') {
      if (sampleCountry === preferredCountry && !fallbackLanguageSameCountry) {
        fallbackLanguageSameCountry = sample;
      } else if (!sampleCountry && !fallbackLanguageNoCountry) {
        fallbackLanguageNoCountry = sample;
      } else if (!fallbackLanguageAnyCountry) {
        fallbackLanguageAnyCountry = sample;
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

export const useSamples = () => {
  return useK8sWatchResource<ConsoleSample[]>({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(ConsoleSampleModel),
  });
};

export const getSample = (name: string): Promise<ConsoleSample> =>
  k8sGetResource({ model: ConsoleSampleModel, name });
