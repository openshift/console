import * as React from 'react';
import { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import {
  CatalogExtensionHookOptions,
  CatalogItem,
} from '@console/dynamic-plugin-sdk/src/extensions';

type CatalogExtensionHookResolverProps = {
  id: string;
  useValue: ExtensionHook<CatalogItem[]>;
  options: CatalogExtensionHookOptions;
  onValueResolved: (value: CatalogItem[], id: string) => void;
  onValueError: (error: any) => void;
};

const CatalogExtensionHookResolver: React.FC<CatalogExtensionHookResolverProps> = ({
  id,
  useValue,
  options,
  onValueResolved,
  onValueError,
}) => {
  const [value, loaded, loadError] = useValue(options);

  React.useEffect(() => {
    if (loaded) onValueResolved(value, id);
  }, [id, loaded, onValueResolved, value]);

  React.useEffect(() => {
    if (loadError) onValueError(loadError);
  }, [loadError, onValueError]);

  return null;
};

export default CatalogExtensionHookResolver;
