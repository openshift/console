import type { FC } from 'react';
import { useEffect } from 'react';
import type { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { CatalogCategory } from '@console/dynamic-plugin-sdk/src/extensions';

type CatalogCategoryProviderResolverProps = {
  id: string;
  useValue: ExtensionHook<CatalogCategory[]>;
  onValueResolved: (value: CatalogCategory[], id: string) => void;
};

const CatalogCategoryProviderResolver: FC<CatalogCategoryProviderResolverProps> = ({
  id,
  useValue,
  onValueResolved,
}) => {
  const value = useValue({});

  useEffect(() => {
    onValueResolved(value, id);
    // unnecessary to run effect again if the onValueResolved callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, value]);

  return null;
};

export default CatalogCategoryProviderResolver;
