import * as React from 'react';
import { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { CatalogExtensionHookOptions } from '@console/dynamic-plugin-sdk/src/extensions';

type CatalogExtensionHookResolverProps<T> = {
  id: string;
  useValue: ExtensionHook<T>;
  options: CatalogExtensionHookOptions;
  onValueResolved: (value: T, id: string) => void;
  onValueError?: (error: any, id: string) => void;
};

const CatalogExtensionHookResolver = function<T>({
  id,
  useValue,
  options,
  onValueResolved,
  onValueError,
}: CatalogExtensionHookResolverProps<T>) {
  const [value, loaded, loadError] = useValue(options);

  React.useEffect(() => {
    if (loaded) onValueResolved(value, id);
    // unnecessary to run effect again if the onValueResolved callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loaded, value]);

  React.useEffect(() => {
    if (loadError && onValueError) onValueError(loadError, id);
    // unnecessary to run effect again if the onValueError callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadError]);

  return null;
};

export default CatalogExtensionHookResolver;
