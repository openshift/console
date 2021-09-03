import * as React from 'react';
import { ResizeDirection } from 're-resizable';
import { Rnd } from 'react-rnd';
import { CatalogType } from '@console/dev-console/src/components/catalog/utils/types';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  getQueryArgument,
  removeQueryArgument,
  setQueryArgument,
  history,
} from '@console/internal/components/utils';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import QuickSearchBar from './QuickSearchBar';
import QuickSearchContent from './QuickSearchContent';
import { DetailsRendererFunction } from './QuickSearchDetails';
import { CatalogLinkData, QuickSearchData } from './utils/quick-search-types';
import { handleCta } from './utils/quick-search-utils';

import './QuickSearchModalBody.scss';

interface QuickSearchModalBodyProps {
  allCatalogItemsLoaded: boolean;
  searchCatalog: (searchTerm: string) => QuickSearchData;
  searchPlaceholder: string;
  namespace: string;
  closeModal: () => void;
  limitItemCount?: number;
  icon?: React.ReactNode;
  detailsRenderer?: DetailsRendererFunction;
  maxDimension?: { maxHeight: number; maxWidth: number };
  viewContainer?: HTMLElement; // pass the html container element to specify the movement boundary
}

const QuickSearchModalBody: React.FC<QuickSearchModalBodyProps> = ({
  searchCatalog,
  namespace,
  closeModal,
  limitItemCount,
  searchPlaceholder,
  allCatalogItemsLoaded,
  icon,
  detailsRenderer,
  maxDimension,
  viewContainer,
}) => {
  const DEFAULT_HEIGHT_WITH_NO_ITEMS = 60;
  const DEFAULT_HEIGHT_WITH_ITEMS = 483;
  const MIN_HEIGHT = 240;
  const MIN_WIDTH = 225;
  const [catalogItems, setCatalogItems] = React.useState<CatalogItem[]>(null);
  const [catalogTypes, setCatalogTypes] = React.useState<CatalogType[]>([]);
  const [isRndActive, setIsRndActive] = React.useState(false);
  const [maxHeight, setMaxHeight] = React.useState(DEFAULT_HEIGHT_WITH_NO_ITEMS);
  const [minHeight, setMinHeight] = React.useState(DEFAULT_HEIGHT_WITH_NO_ITEMS);
  const [minWidth, setMinWidth] = React.useState(MIN_WIDTH);
  const [searchTerm, setSearchTerm] = React.useState<string>(
    getQueryArgument('catalogSearch') || '',
  );
  const [selectedItemId, setSelectedItemId] = React.useState<string>('');
  const [selectedItem, setSelectedItem] = React.useState<CatalogItem>(null);
  const [viewAll, setViewAll] = React.useState<CatalogLinkData[]>(null);
  const [items, setItems] = React.useState<number>(limitItemCount);
  const [modalSize, setModalSize] = React.useState<{ height: number; width: number }>();
  const [draggableBoundary, setDraggableBoundary] = React.useState<string>(null);
  const ref = React.useRef<HTMLDivElement>();
  const fireTelemetryEvent = useTelemetry();
  const listCatalogItems = limitItemCount > 0 ? catalogItems?.slice(0, items) : catalogItems;

  const getModalHeight = () => {
    let height: number = DEFAULT_HEIGHT_WITH_NO_ITEMS;
    if (catalogItems?.length > 0) {
      if (modalSize?.height >= minHeight) {
        return modalSize?.height;
      }
      setModalSize({ ...modalSize, height: DEFAULT_HEIGHT_WITH_ITEMS });
      height = DEFAULT_HEIGHT_WITH_ITEMS;
    }
    return height;
  };

  React.useEffect(() => {
    if (viewContainer) {
      const className = viewContainer.classList;
      setDraggableBoundary(`.${className[0]}`);
    }
  }, [viewContainer]);

  React.useEffect(() => {
    if (catalogItems === null || catalogItems?.length === 0) {
      setMaxHeight(DEFAULT_HEIGHT_WITH_NO_ITEMS);
      setMinHeight(DEFAULT_HEIGHT_WITH_NO_ITEMS);
      setMinWidth(MIN_WIDTH);
    } else if (catalogItems?.length > 0) {
      setMaxHeight(maxDimension?.maxHeight || undefined);
      setMinHeight(MIN_HEIGHT);
      setMinWidth(MIN_WIDTH);
    }
  }, [catalogItems, maxDimension]);

  React.useEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setModalSize({ width, height });
    }
  }, []);

  React.useEffect(() => {
    if (searchTerm) {
      const { filteredItems, viewAllLinks, catalogItemTypes } = searchCatalog(searchTerm);
      setCatalogItems(filteredItems);
      setCatalogTypes(catalogItemTypes);
      setViewAll(viewAllLinks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCatalog]);

  React.useEffect(() => {
    if (catalogItems && !selectedItemId) {
      setSelectedItemId(catalogItems[0]?.uid);
      setSelectedItem(catalogItems[0]);
    }
  }, [catalogItems, selectedItemId]);

  const handleDrag = () => {
    setIsRndActive(true);
  };

  const handleResize = (e: MouseEvent, direction: ResizeDirection, elementRef: HTMLElement) => {
    setIsRndActive(true);
    setModalSize({
      height: elementRef.offsetHeight,
      width: elementRef.offsetWidth,
    });
  };

  const handleResizeStop = () => {
    setTimeout(() => setIsRndActive(false), 0);
  };

  const onSearch = React.useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (value) {
        const { filteredItems, viewAllLinks, catalogItemTypes } = searchCatalog(value);
        setCatalogItems(filteredItems);
        setCatalogTypes(catalogItemTypes);
        setViewAll(viewAllLinks);
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

  const onEnter = React.useCallback(
    (e) => {
      const { id } = document.activeElement;
      const activeViewAllLink = viewAll?.find((link) => link.catalogType === id);
      if (activeViewAllLink) {
        history.push(activeViewAllLink.to);
      } else if (selectedItem) {
        handleCta(e, selectedItem, closeModal, fireTelemetryEvent);
      }
    },
    [closeModal, fireTelemetryEvent, selectedItem, viewAll],
  );

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

  const handleListChange = (i: number) => {
    setItems(i);
  };

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
          onEnter(e);
          break;
        }
        default:
      }
    };

    const onOutsideClick = (e: MouseEvent) => {
      const modalBody = ref.current.parentElement;
      if (!modalBody?.contains(e.target as Node) && !isRndActive) {
        closeModal();
      }
    };

    document.addEventListener('click', onOutsideClick);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('click', onOutsideClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeModal, onCancel, onEnter, selectNext, selectPrevious, isRndActive]);

  return (
    <Rnd
      style={{ position: 'relative' }}
      size={{ height: modalSize?.height, width: modalSize?.width }}
      onDrag={handleDrag}
      onDragStop={handleResizeStop}
      onResize={handleResize}
      maxHeight={maxHeight}
      maxWidth={maxDimension?.maxWidth || undefined}
      minHeight={minHeight}
      minWidth={minWidth}
      bounds={draggableBoundary}
      onResizeStop={handleResizeStop}
      enableResizing={
        catalogItems === null || catalogItems?.length === 0
          ? {
              bottom: false,
              bottomLeft: false,
              bottomRight: false,
              left: true,
              right: true,
              top: false,
              topLeft: false,
              topRight: false,
            }
          : true
      }
    >
      <div
        ref={ref}
        className="ocs-quick-search-modal-body"
        style={{
          height: getModalHeight(),
        }}
      >
        <QuickSearchBar
          searchTerm={searchTerm}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          showNoResults={catalogItems?.length === 0}
          itemsLoaded={allCatalogItemsLoaded}
          icon={icon}
          autoFocus
        />
        {catalogItems && selectedItem && (
          <QuickSearchContent
            catalogItems={catalogItems}
            catalogItemTypes={catalogTypes}
            viewAll={viewAll}
            searchTerm={searchTerm}
            selectedItemId={selectedItemId}
            closeModal={closeModal}
            selectedItem={selectedItem}
            namespace={namespace}
            limitItemCount={limitItemCount}
            detailsRenderer={detailsRenderer}
            onListChange={handleListChange}
            onSelect={(itemId) => {
              setSelectedItemId(itemId);
              setSelectedItem(catalogItems?.find((item) => item.uid === itemId));
            }}
          />
        )}
      </div>
    </Rnd>
  );
};

export default QuickSearchModalBody;
