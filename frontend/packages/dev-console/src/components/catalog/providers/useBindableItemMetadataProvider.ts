import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CatalogItem,
  CatalogItemMetadataProviderFunction,
  ExtensionHook,
} from '@console/dynamic-plugin-sdk';
import { fetchBindableServices } from '../../topology/bindable-services/fetch-bindable-services-utils';

const useBindableItemMetadataProvider: ExtensionHook<CatalogItemMetadataProviderFunction> = () => {
  const [bindableServices, setBindableServices] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchBindableServices()
      .then((resp) => {
        setBindableServices(resp);
        setLoaded(true);
      })
      .catch((e) => {
        setBindableServices([]);
        setLoaded(true);
        setError(e);
      });
  }, []);

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
