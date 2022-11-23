import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CatalogItem,
  CatalogItemMetadataProviderFunction,
  ExtensionHook,
} from '@console/dynamic-plugin-sdk';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { BindableServicesModel } from '../../topology/bindable-services/models';
import { BindableServicesKind } from '../../topology/bindable-services/types';

const useBindableItemMetadataProvider: ExtensionHook<CatalogItemMetadataProviderFunction> = () => {
  const [bindableKinds, loaded, error] = useK8sWatchResource<BindableServicesKind>({
    groupVersionKind: getGroupVersionKindForModel(BindableServicesModel),
    name: 'bindable-kinds',
  });

  const [t] = useTranslation();

  const bindableMetadata = React.useRef<ReturnType<CatalogItemMetadataProviderFunction>>({
    tags: ['bindable'],
    badges: [{ text: t('devconsole~Bindable') }],
    attributes: {
      bindable: t('devconsole~Bindable'),
    },
  });

  const provider = React.useCallback<CatalogItemMetadataProviderFunction>(
    (item: CatalogItem) => {
      if (!loaded || !Array.isArray(bindableKinds?.status)) {
        return null;
      }
      if (
        bindableKinds.status.some(
          (value) =>
            value.kind === item.data.kind &&
            value.version === item.data.version &&
            value.group ===
              item.data.name
                .split('.')
                .slice(1)
                .join('.'),
        )
      ) {
        return bindableMetadata.current;
      }
      return null;
    },
    [bindableKinds, loaded],
  );
  return [provider, loaded, error];
};

export default useBindableItemMetadataProvider;
