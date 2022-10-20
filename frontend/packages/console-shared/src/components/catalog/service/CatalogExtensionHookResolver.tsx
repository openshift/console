import * as React from 'react';
import { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { CatalogExtensionHookOptions } from '@console/dynamic-plugin-sdk/src/extensions';

type CatalogExtensionHookResolverProps<T> = {
  id: string;
  useValue: ExtensionHook<T>;
  options: CatalogExtensionHookOptions;
  onValueResolved: (id: string, value: T) => void;
  onValueError?: (id: string, error: any) => void;
  onCatalogTypeError?: (id: string, error: any) => void;
};

const CatalogExtensionHookResolver = function<T>({
  id,
  useValue,
  options,
  onValueResolved,
  onValueError,
  onCatalogTypeError,
}: CatalogExtensionHookResolverProps<T>) {
  const [value, loaded, loadError] = useValue(options);

  React.useEffect(() => {
    if (loaded) onValueResolved(id, value);
    // unnecessary to run effect again if the onValueResolved callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loaded, value]);

  React.useEffect(() => {
    if (Array.isArray(value) && value?.length > 0 && onCatalogTypeError)
      onCatalogTypeError(id, loadError);
    else if (onValueError) onValueError(id, loadError);
    // unnecessary to run effect again if the onValueError callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadError, value]);

  return null;
};

export default CatalogExtensionHookResolver;
