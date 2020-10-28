import * as React from 'react';
import { useDeepCompareMemoize } from '@console/shared';
import {
  CatalogItem,
  CatalogItemProvider,
  CatalogItemProviderResult,
  LoadedExtension,
} from '@console/plugin-sdk';

type CatalogItemsHookResolverProps = {
  useItemsProvider: () => CatalogItemProviderResult;
  onValueResolved: (value: CatalogItem[], extension: LoadedExtension<CatalogItemProvider>) => void;
  extension: LoadedExtension<CatalogItemProvider>;
};

const CatalogItemsHookResolver: React.FC<CatalogItemsHookResolverProps> = ({
  useItemsProvider,
  onValueResolved,
  extension,
}) => {
  const [value, loaded] = useItemsProvider();

  const memoizedValue = useDeepCompareMemoize(value);

  React.useEffect(() => {
    if (loaded) onValueResolved(memoizedValue, extension);
  }, [extension, loaded, memoizedValue, onValueResolved]);

  return null;
};

export default CatalogItemsHookResolver;
