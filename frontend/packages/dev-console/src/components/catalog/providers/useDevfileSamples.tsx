import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { coFetchJSON } from '@console/internal/co-fetch';
import { APIError, useActiveNamespace } from '@console/shared';
import { DevfileSample } from '../../import/devfile/devfile-types';

const normalizeDevfileSamples = (
  devfileSamples: DevfileSample[],
  activeNamespace: string,
  t: TFunction,
): CatalogItem[] => {
  const normalizedDevfileSamples = devfileSamples.map((sample) => {
    const { name: uid, displayName, description, tags, git, icon, provider } = sample;
    const gitRepoUrl = Object.values(git.remotes)[0];
    const label = t('devconsole~Create Devfile Sample');
    const href = `/import/ns/${activeNamespace}?importType=devfile&formType=sample&devfileName=${uid}&gitRepo=${gitRepoUrl}`;
    const iconUrl = icon || '';

    const item: CatalogItem = {
      uid,
      type: 'Devfile',
      name: displayName,
      description,
      tags,
      provider,
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
  const [activeNamespace] = useActiveNamespace();
  const [devfileSamples, setDevfileSamples] = React.useState<DevfileSample[]>();
  const [loadedError, setLoadedError] = React.useState<APIError>();

  React.useEffect(() => {
    let mounted = true;
    coFetchJSON('/api/devfile/samples/?registry=https://registry.devfile.io')
      .then((res) => {
        if (mounted) setDevfileSamples(res);
      })
      .catch((err) => {
        if (mounted) setLoadedError(err);
      });

    return () => (mounted = false);
  }, []);

  const normalizedDevfileSamples = React.useMemo(
    () => normalizeDevfileSamples(devfileSamples || [], activeNamespace, t),
    [activeNamespace, devfileSamples, t],
  );

  const loaded = !!devfileSamples;

  return [normalizedDevfileSamples, loaded, loadedError];
};

export default useDevfileSamples;
