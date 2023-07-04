/* eslint-disable no-console */
import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { useActiveNamespace } from '@console/shared/src';
import { ConsoleSample } from '../../../types/samples';
import {
  createSampleLink,
  getBestMatch,
  groupConsoleSamplesByName,
  useSamples,
} from '../../../utils/samples';

export const normalizeConsoleSamples = (activeNamespace: string, t: TFunction) => {
  const createLabel = t('devconsole~Create');

  return (sample: ConsoleSample): CatalogItem<ConsoleSample> | null => {
    const href = createSampleLink(sample, activeNamespace);
    // Unsupported source type, will be dropped.
    if (!href) {
      return null;
    }

    return {
      uid: sample.metadata.uid,
      type: 'ConsoleSample',
      typeLabel: sample.spec.type || '',
      name: sample.metadata.name,
      title: sample.spec.title,
      description: sample.spec.abstract,
      provider: sample.spec.provider,
      tags: sample.spec.tags,
      icon: sample.spec.icon?.startsWith('data:')
        ? {
            url: sample.spec.icon,
          }
        : sample.spec.icon
        ? {
            url: `data:image;base64,${sample.spec.icon}`,
          }
        : null,
      cta: {
        label: createLabel,
        href,
      },
      data: sample,
    };
  };
};

export const useConsoleSamplesCatalogProvider = (): [CatalogItem[], boolean, any] => {
  const { i18n, t } = useTranslation();
  const preferredLanguage = i18n.language;
  const [activeNamespace] = useActiveNamespace();
  const [allSamples, loaded, loadedError] = useSamples();

  const catalogItems = React.useMemo<CatalogItem[]>(() => {
    const filteredSamples = allSamples.filter((sample) => !sample.spec.tags?.includes('hidden'));

    const groupedSamples = groupConsoleSamplesByName(filteredSamples);

    const bestMatchSamples = Object.values(groupedSamples).map((samples2) =>
      getBestMatch(samples2, preferredLanguage),
    );

    bestMatchSamples.sort((sampleA, sampleB) =>
      sampleA.spec.title.localeCompare(sampleB.spec.title),
    );

    return bestMatchSamples.map(normalizeConsoleSamples(activeNamespace, t)).filter(Boolean);
  }, [allSamples, activeNamespace, preferredLanguage, t]);

  return [catalogItems, loaded, loadedError];
};

export default useConsoleSamplesCatalogProvider;
