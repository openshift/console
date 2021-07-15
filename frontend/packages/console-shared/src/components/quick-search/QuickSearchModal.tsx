import * as React from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import QuickSearchModalBody from './QuickSearchModalBody';
import { QuickSearchData } from './utils/quick-search-types';

interface QuickSearchModalProps {
  isOpen: boolean;
  namespace: string;
  closeModal: () => void;
  allCatalogItemsLoaded: boolean;
  searchCatalog: (searchTerm: string) => QuickSearchData;
  searchPlaceholder: string;
  viewContainer?: HTMLElement;
}

const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  namespace,
  closeModal,
  searchCatalog,
  searchPlaceholder,
  allCatalogItemsLoaded,
  viewContainer,
}) => {
  const { t } = useTranslation();

  return viewContainer ? (
    <Modal
      variant={ModalVariant.medium}
      aria-label={t('console-shared~Quick search')}
      isOpen={isOpen}
      showClose={false}
      position="top"
      positionOffset="15%"
      hasNoBodyWrapper
      appendTo={viewContainer}
    >
      <QuickSearchModalBody
        allCatalogItemsLoaded={allCatalogItemsLoaded}
        searchCatalog={searchCatalog}
        searchPlaceholder={searchPlaceholder}
        namespace={namespace}
        closeModal={closeModal}
      />
    </Modal>
  ) : null;
};

export default QuickSearchModal;
