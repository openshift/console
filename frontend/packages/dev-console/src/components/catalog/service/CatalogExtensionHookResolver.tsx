import * as React from 'react';
import {
  CatalogItem,
  CatalogExtensionHook,
  CatalogExtensionHookOptions,
} from '@console/plugin-sdk';

type CatalogExtensionHookResolverProps = {
  id: string;
  useValue: CatalogExtensionHook<CatalogItem[]>;
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
