import * as React from 'react';
import * as _ from 'lodash';
import { CatalogItem, CatalogItemProvider, LoadedExtension } from '@console/plugin-sdk';
import { keywordCompare } from '../utils/utils';
import useCatalogExtensions from '../hooks/useCatalogExtensions';
import CustomHookResolver from './CatalogItemsHookResolver';

export type CatalogService = {
  type: string;
  items: CatalogItem[];
  loaded: boolean;
  searchCatalog: (query: string) => CatalogItem[];
  catalogExtensions: LoadedExtension<CatalogItemProvider>;
};

type CatalogServiceProviderProps = {
  type?: string;
  children: (service: CatalogService) => React.ReactNode;
};

const CatalogServiceProvider: React.FC<CatalogServiceProviderProps> = ({ type, children }) => {
  const [extensions, loaded] = useCatalogExtensions();
  const [resolvedNumber, setResolvedNumber] = React.useState<number>(0);
  const items = React.useRef<CatalogItem[]>([]);
  const resolvedValues = React.useRef<{ [key: string]: CatalogItem[] }>({});

  const catalogExtensions = type
    ? extensions.filter((e) => e.properties.type === type)
    : extensions;

  const handleValueResolved = React.useCallback(
    (value, obj) => {
      resolvedValues.current[obj.properties.type] = value;
      if (Object.keys(resolvedValues.current).length === catalogExtensions.length) {
        items.current = _.reduce(
          resolvedValues.current,
          (allItems, resolvedValue: CatalogItem[]) => {
            allItems.push(...resolvedValue);
            return allItems;
          },
          [],
        );
        setResolvedNumber(items.current.length);
      }
    },
    [catalogExtensions.length],
  );

  const searchCatalog = (query: string) => {
    return items.current.filter((item) => keywordCompare(query, item));
  };

  const catalogService = {
    type: type || 'Generic',
    items: items.current,
    loaded: catalogExtensions.length > 0 ? loaded && resolvedNumber > 0 : true,
    searchCatalog,
    catalogExtensions,
  };

  return (
    <>
      {catalogExtensions.map((extension) => (
        <CustomHookResolver
          key={extension.properties.type}
          extension={extension}
          useItemsProvider={extension.properties.provider}
          onValueResolved={handleValueResolved}
        />
      ))}
      {children(catalogService)}
    </>
  );
};

export default CatalogServiceProvider;
