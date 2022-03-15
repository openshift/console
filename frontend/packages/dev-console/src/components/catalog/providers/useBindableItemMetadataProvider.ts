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
import { BindableServiceGVK, BindableServicesKind } from '../../topology/bindable-services/types';

const useBindableItemMetadataProvider: ExtensionHook<CatalogItemMetadataProviderFunction> = () => {
  const [bindableKindsRes, loaded, error] = useK8sWatchResource<BindableServicesKind>({
    groupVersionKind: getGroupVersionKindForModel(BindableServicesModel),
    name: 'bindable-kinds',
  });

  const bindableServices: BindableServiceGVK[] = bindableKindsRes?.status ?? [];

  const [t] = useTranslation();

  const bindableMtadata = React.useRef<ReturnType<CatalogItemMetadataProviderFunction>>({
    tags: ['bindable'],
    badges: [{ text: t('devconsole~Bindable') }],
    attributes: {
      bindable: t('devconsole~Bindable'),
    },
  });

  const notbindableMtadata = React.useRef<ReturnType<CatalogItemMetadataProviderFunction>>({
    attributes: {
      bindable: t('devconsole~Not Bindable'),
    },
  });

  const provider = React.useCallback<CatalogItemMetadataProviderFunction>(
    (item: CatalogItem) => {
      if (
        loaded &&
        bindableServices.some(
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
        return bindableMtadata.current;
      }
      return notbindableMtadata.current;
    },
    [bindableServices, loaded],
  );
  return [provider, loaded, error];
};

export default useBindableItemMetadataProvider;
