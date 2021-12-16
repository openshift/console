import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { coFetchJSON } from '@console/internal/co-fetch';
import { ExternalLink } from '@console/internal/components/utils';
import { APIError } from '@console/shared';
import { DevfileSample } from '../../import/devfile/devfile-types';

const normalizeDevfile = (devfileSamples: DevfileSample[], t: TFunction): CatalogItem[] => {
  const normalizedDevfileSamples = devfileSamples?.map((sample) => {
    const { name: uid, displayName, description, tags, git, icon, provider } = sample;
    const gitRepoUrl = Object.values(git.remotes)[0];
    const href = `/import?importType=devfile&devfileName=${uid}&gitRepo=${gitRepoUrl}`;
    const createLabel = t('devconsole~Create Application');
    const type = 'Devfile';

    const detailsProperties = [
      {
        label: t('devconsole~Sample repository'),
        value: (
          <ExternalLink href={gitRepoUrl} additionalClassName="co-break-all" text={gitRepoUrl} />
        ),
      },
    ];

    const detailsDescriptions = [
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
  const [devfileSamples, setDevfileSamples] = React.useState<DevfileSample[]>([]);
  const [loadedError, setLoadedError] = React.useState<APIError>();
  const { t } = useTranslation();

  React.useEffect(() => {
    let mounted = true;
    coFetchJSON('/api/devfile/samples/?registry=https://registry.devfile.io')
      .then((resp) => {
        if (mounted) setDevfileSamples(resp);
      })
      .catch((err) => {
        if (mounted) setLoadedError(err);
      });
    return () => (mounted = false);
  }, []);

  const normalizedDevfileSamples = React.useMemo(() => normalizeDevfile(devfileSamples, t), [
    devfileSamples,
    t,
  ]);

  const loaded = !!devfileSamples;

  return [normalizedDevfileSamples, loaded, loadedError];
};

export default useDevfile;
