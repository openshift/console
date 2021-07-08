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
  viewContainer?: HTMLElement;
}

const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  namespace,
  closeModal,
  searchCatalog,
  allCatalogItemsLoaded,
  viewContainer,
}) => {
  const { t } = useTranslation();

  return viewContainer ? (
    <Modal
      variant={ModalVariant.medium}
      aria-label={t('topology~Quick search')}
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
        namespace={namespace}
        closeModal={closeModal}
      />
    </Modal>
  ) : null;
};

export default QuickSearchModal;
