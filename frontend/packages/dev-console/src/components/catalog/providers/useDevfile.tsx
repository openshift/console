import { useState, useEffect, useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type {
  CatalogItem,
  CatalogItemDetailsDescription,
  CatalogItemDetailsProperty,
  ExtensionHook,
} from '@console/dynamic-plugin-sdk';
import { coFetchJSON } from '@console/internal/co-fetch';
import type { APIError } from '@console/shared';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import type { DevfileSample } from '../../import/devfile/devfile-types';

const normalizeDevfile = (devfileSamples: DevfileSample[], t: TFunction): CatalogItem[] => {
  const normalizedDevfileSamples = devfileSamples?.map((sample) => {
    const { name: uid, displayName, description, tags, git, icon, provider } = sample;
    const gitRepositoryUrl = Object.values(git.remotes)[0];

    const searchParams = new URLSearchParams();
    searchParams.set('importType', 'devfile');
    searchParams.set('devfileName', uid);
    searchParams.set('git.repository', gitRepositoryUrl);

    const href = `/import?${searchParams}`;
    const createLabel = t('devconsole~Create');
    const type = 'Devfile';

    const detailsProperties: CatalogItemDetailsProperty[] = [];
    if (gitRepositoryUrl) {
      detailsProperties.push({
        label: t('devconsole~Sample repository'),
        value: (
          <ExternalLink text={gitRepositoryUrl} href={gitRepositoryUrl} className="co-break-all" />
        ),
      });
    }

    const detailsDescriptions: CatalogItemDetailsDescription[] = [
      {
        value: <p>{description}</p>,
      },
    ];

    const item: CatalogItem = {
      uid: `${type}-${uid}`,
      type,
      name: displayName,
      description,
      tags,
      provider,
      cta: {
        label: createLabel,
        href,
      },
      icon: { url: icon },
      details: {
        properties: detailsProperties,
        descriptions: detailsDescriptions,
      },
    };

    return item;
  });

  return normalizedDevfileSamples;
};

const useDevfile: ExtensionHook<CatalogItem[]> = (): [CatalogItem[], boolean, any] => {
  const [devfileSamples, setDevfileSamples] = useState<DevfileSample[]>();
  const [loadedError, setLoadedError] = useState<APIError>();
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    coFetchJSON('/api/devfile/samples/?registry=https://registry.devfile.io')
      .then((resp) => {
        if (mounted) setDevfileSamples(resp);
      })
      .catch((err) => {
        if (mounted) setLoadedError(err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const normalizedDevfileSamples = useMemo(() => normalizeDevfile(devfileSamples || [], t), [
    devfileSamples,
    t,
  ]);

  const loaded = !!devfileSamples;

  return [normalizedDevfileSamples, loaded, loadedError];
};

export default useDevfile;
