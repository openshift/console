import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ExtensionHook, CatalogItem } from '@console/dynamic-plugin-sdk';
import { coFetchJSON } from '@console/internal/co-fetch';
import { APIError } from '@console/shared';
import { DevfileSample } from '../../import/devfile/devfile-types';

const normalizeDevfileSamples = (devfileSamples: DevfileSample[], t: TFunction): CatalogItem[] => {
  const normalizedDevfileSamples = devfileSamples.map((sample) => {
    const { name: uid, displayName, description, tags, git, icon } = sample;
    const gitRepoUrl = Object.values(git.remotes)[0];
    const label = t('devconsole~Create Devfile Sample');
    const href = `/import?importType=devfile&formType=sample&devfileName=${uid}&gitRepo=${gitRepoUrl}`;
    const iconUrl = icon ? `data:image/png;base64,${icon}` : '';

    const item: CatalogItem = {
      uid,
      type: 'Sample',
      name: displayName,
      description,
      tags,
      cta: {
        label,
        href,
      },
      icon: { url: iconUrl },
    };

    return item;
  });

  return normalizedDevfileSamples;
};

const useDevfileSamples: ExtensionHook<CatalogItem[]> = (): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [devfileSamples, setDevfileSamples] = React.useState<DevfileSample[]>();
  const [loadedError, setLoadedError] = React.useState<APIError>();

  React.useEffect(() => {
    let mounted = true;
    const payload = {
      registry: 'sample-placeholder',
    };
    coFetchJSON
      .put('/api/devfile/samples', payload)
      .then((res) => {
        if (mounted) setDevfileSamples(res);
      })
      .catch((err) => {
        if (mounted) setLoadedError(err);
      });

    return () => (mounted = false);
  }, []);

  const normalizedDevfileSamples = React.useMemo(
    () => normalizeDevfileSamples(devfileSamples || [], t),
    [devfileSamples, t],
  );

  const loaded = !!devfileSamples;

  return [normalizedDevfileSamples, loaded, loadedError];
};

export default useDevfileSamples;
