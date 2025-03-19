import * as React from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DetailsRendererFunction } from './QuickSearchDetails';
import QuickSearchModalBody from './QuickSearchModalBody';
import { QuickSearchData } from './utils/quick-search-types';
import './QuickSearchModal.scss';

interface QuickSearchModalProps {
  isOpen: boolean;
  namespace: string;
  closeModal: () => void;
  allCatalogItemsLoaded: boolean;
  searchCatalog: (searchTerm: string) => QuickSearchData;
  searchPlaceholder: string;
  viewContainer?: HTMLElement;
  limitItemCount?: number;
  icon?: React.ReactNode;
  detailsRenderer?: DetailsRendererFunction;
}

const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  namespace,
  closeModal,
  searchCatalog,
  searchPlaceholder,
  allCatalogItemsLoaded,
  viewContainer,
  icon,
  limitItemCount,
  detailsRenderer,
}) => {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDivElement>();

  // close the modal when clicking outside of it
  React.useEffect(() => {
    const handleOnClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        closeModal();
      }
    };
    document.addEventListener('click', handleOnClick);
    return () => document.removeEventListener('click', handleOnClick);
  }, [ref, closeModal]);

  return viewContainer ? (
    <Modal
      className="ocs-quick-search-modal"
      variant={ModalVariant.medium}
      aria-label={t('console-shared~Quick search')}
      isOpen={isOpen}
      position="top"
      positionOffset="15%"
      appendTo={viewContainer}
    >
      <div ref={ref}>
        <QuickSearchModalBody
          allCatalogItemsLoaded={allCatalogItemsLoaded}
          searchCatalog={searchCatalog}
          searchPlaceholder={searchPlaceholder}
          namespace={namespace}
          closeModal={closeModal}
          limitItemCount={limitItemCount}
          icon={icon}
          detailsRenderer={detailsRenderer}
        />
      </div>
    </Modal>
  ) : null;
};

export default QuickSearchModal;
