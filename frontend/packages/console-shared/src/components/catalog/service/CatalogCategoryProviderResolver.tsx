import * as React from 'react';
import { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { CatalogCategory } from '@console/dynamic-plugin-sdk/src/extensions';

type CatalogCategoryProviderResolverProps = {
  id: string;
  useValue: ExtensionHook<CatalogCategory[]>;
  onValueResolved: (value: CatalogCategory[], id: string) => void;
};

const CatalogCategoryProviderResolver: React.FC<CatalogCategoryProviderResolverProps> = ({
  id,
  useValue,
  onValueResolved,
}) => {
  const value = useValue({});

  React.useEffect(() => {
    onValueResolved(value, id);
    // unnecessary to run effect again if the onValueResolved callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, value]);

  return null;
};

export default CatalogCategoryProviderResolver;
