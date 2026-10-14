import type { FC } from 'react';
import { useEffect } from 'react';
import type {
  ExtensionHook,
  ExtensionHookResult,
} from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { CatalogCategory } from '@console/dynamic-plugin-sdk/src/extensions/catalog';

type CatalogCategoryProviderResolverProps = {
  id: string;
  useValue: ExtensionHook<CatalogCategory[]> | (() => CatalogCategory[]);
  onValueResolved: (value: CatalogCategory[], id: string) => void;
};

const CatalogCategoryProviderResolver: FC<CatalogCategoryProviderResolverProps> = ({
  id,
  useValue,
  onValueResolved,
}) => {
  const result = useValue({});
  // Older category providers return the array directly instead of the SDK hook result.
  const [value, loaded] = Array.isArray(result[0])
    ? (result as ExtensionHookResult<CatalogCategory[]>)
    : ([result as CatalogCategory[], true] as const);

  useEffect(() => {
    if (loaded) onValueResolved(value, id);
    // unnecessary to run effect again if the onValueResolved callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loaded, value]);

  return null;
};

export default CatalogCategoryProviderResolver;
