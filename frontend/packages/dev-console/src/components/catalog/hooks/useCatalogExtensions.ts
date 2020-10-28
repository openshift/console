import * as React from 'react';
import { CatalogItemProvider, isCatalogItemProvider, useExtensions } from '@console/plugin-sdk';

const useCatalogExtensions = () => {
  const catalogExtensions = useExtensions<CatalogItemProvider>(isCatalogItemProvider);
  const [resolvedExtensions, setResolvedExtensions] = React.useState<any>([]);
  const [loaded, setLoaded] = React.useState<boolean>(false);

  React.useEffect(() => {
    let disposed = false;

    // eslint-disable-next-line promise/catch-or-return
    Promise.all(
      catalogExtensions.map(async (e) => {
        const provider = await e.properties.provider();
        const filters = e.properties.filters && (await e.properties.filters());
        const groupings = e.properties.groupings && (await e.properties.groupings());
        return Object.freeze({
          ...e,
          properties: { ...e.properties, provider, filters, groupings },
        });
      }),
    ).then((result) => {
      if (!disposed) {
        setResolvedExtensions(result);
        setLoaded(true);
      }
    });

    return () => {
      disposed = true;
    };
  }, [catalogExtensions]);

  return [resolvedExtensions, loaded];
};

export default useCatalogExtensions;
