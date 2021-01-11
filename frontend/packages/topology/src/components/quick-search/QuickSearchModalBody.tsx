import * as React from 'react';
import { CatalogItem } from '@console/plugin-sdk';
import QuickSearchBar from './QuickSearchBar';
import QuickSearchContent from './QuickSearchContent';
import './QuickSearchButton.scss';
import {
  getQueryArgument,
  history,
  removeQueryArgument,
  setQueryArgument,
} from '@console/internal/components/utils';

interface QuickSearchModalBodyProps {
  allCatalogItemsLoaded: boolean;
  searchCatalog: (query: string) => CatalogItem[];
  namespace: string;
  closeModal: () => void;
}

const QuickSearchModalBody: React.FC<QuickSearchModalBodyProps> = ({
  searchCatalog,
  namespace,
  closeModal,
  allCatalogItemsLoaded,
}) => {
  const [catalogItems, setCatalogItems] = React.useState<CatalogItem[]>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>(
    getQueryArgument('catalogSearch') || '',
  );
  const [selectedItemId, setSelectedItemId] = React.useState<string>('');
  const [selectedItem, setSelectedItem] = React.useState<CatalogItem>(null);
  const listCatalogItems = catalogItems?.slice(0, 5);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    searchTerm && allCatalogItemsLoaded && setCatalogItems(searchCatalog(searchTerm));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCatalogItemsLoaded, searchCatalog]);

  React.useEffect(() => {
    if (catalogItems && !selectedItemId) {
      setSelectedItemId(catalogItems[0]?.uid);
      setSelectedItem(catalogItems[0]);
    }
  }, [catalogItems, selectedItemId]);

  const onSearch = React.useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (value) {
        setCatalogItems(searchCatalog(value));
        setQueryArgument('catalogSearch', value);
      } else {
        setCatalogItems(null);
        removeQueryArgument('catalogSearch');
      }
      setSelectedItemId('');
      setSelectedItem(null);
    },
    [searchCatalog],
  );

  const onCancel = React.useCallback(() => {
    const searchInput = ref.current?.firstElementChild?.children?.[1] as HTMLInputElement;
    if (searchInput?.value) {
      document.activeElement !== searchInput && searchInput.focus();
      onSearch('');
    } else {
      closeModal();
    }
  }, [closeModal, onSearch]);

  const getIndexOfSelectedItem = React.useCallback(
    () => listCatalogItems?.findIndex((item) => item.uid === selectedItemId),
    [listCatalogItems, selectedItemId],
  );

  const onEnter = React.useCallback(() => {
    const viewAllLink = document.getElementById('viewAll');
    const { activeElement } = document;
    if (activeElement === viewAllLink) {
      history.push(`/catalog/ns/${namespace}?keyword=${searchTerm}`);
    } else if (selectedItem) {
      history.push(selectedItem.cta.href);
    }
  }, [selectedItem, namespace, searchTerm]);

  const selectPrevious = React.useCallback(() => {
    let index = getIndexOfSelectedItem();
    if (index === 0) index = listCatalogItems?.length;
    setSelectedItemId(listCatalogItems?.[index - 1]?.uid);
    setSelectedItem(listCatalogItems?.[index - 1]);
  }, [listCatalogItems, getIndexOfSelectedItem]);

  const selectNext = React.useCallback(() => {
    const index = getIndexOfSelectedItem();
    setSelectedItemId(listCatalogItems?.[index + 1]?.uid);
    setSelectedItem(listCatalogItems?.[index + 1]);
  }, [listCatalogItems, getIndexOfSelectedItem]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Escape': {
          onCancel();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          selectPrevious();
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          selectNext();
          break;
        }
        case 'Enter': {
          onEnter();
          break;
        }
        default:
      }
    };

    const onOutsideClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        closeModal();
      }
    };

    document.addEventListener('click', onOutsideClick);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('click', onOutsideClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeModal, onCancel, onEnter, selectNext, selectPrevious]);

  return (
    <div ref={ref}>
      <QuickSearchBar
        searchTerm={searchTerm}
        onSearch={onSearch}
        showNoResults={catalogItems?.length === 0}
        itemsLoaded={allCatalogItemsLoaded}
        autoFocus
      />
      {catalogItems && selectedItem && (
        <QuickSearchContent
          catalogItems={catalogItems}
          searchTerm={searchTerm}
          selectedItemId={selectedItemId}
          selectedItem={selectedItem}
          namespace={namespace}
          onSelect={(itemId) => {
            setSelectedItemId(itemId);
            setSelectedItem(catalogItems?.find((item) => item.uid === itemId));
          }}
        />
      )}
    </div>
  );
};

export default QuickSearchModalBody;
