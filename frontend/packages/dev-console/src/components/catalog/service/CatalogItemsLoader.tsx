import * as React from 'react';
import * as _ from 'lodash';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { CatalogExtensionHookOptions, CatalogItem, CatalogItemProvider } from '@console/plugin-sdk';
import CatalogExtensionHookResolver from './CatalogExtensionHookResolver';

type CatalogItemsLoaderProps = {
  catalogType: string;
  providerExtensions: ResolvedExtension<CatalogItemProvider>[];
  options: CatalogExtensionHookOptions;
  onItemsLoaded: (items: CatalogItem[], type: string) => void;
  onLoadError: (error: any) => void;
};

const CatalogItemsLoader: React.FC<CatalogItemsLoaderProps> = ({
  catalogType,
  providerExtensions,
  options,
  onItemsLoaded,
  onLoadError,
}) => {
  const [resolvedProviderValues, setResolvedProviderValues] = React.useState<{
    [key: string]: CatalogItem[];
  }>({});

  const loaded =
    providerExtensions.length === 0 ||
    providerExtensions.every(({ uid }) => resolvedProviderValues[uid]);

  const handleProviderValueResolved = React.useCallback((value, id) => {
    setResolvedProviderValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  React.useEffect(() => {
    if (loaded) {
      const items = _.flatten(Object.values(resolvedProviderValues));
      onItemsLoaded(items, catalogType);
    }
  }, [catalogType, loaded, onItemsLoaded, resolvedProviderValues]);

  return (
    <>
      {providerExtensions.map((extension) => (
        <CatalogExtensionHookResolver
          key={extension.uid}
          id={extension.uid}
          useValue={extension.properties.provider}
          options={options}
          onValueResolved={handleProviderValueResolved}
          onValueError={onLoadError}
        />
      ))}
    </>
  );
};

export default CatalogItemsLoader;
