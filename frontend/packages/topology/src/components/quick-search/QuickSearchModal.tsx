import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalVariant } from '@patternfly/react-core';
import QuickSearchModalBody from './QuickSearchModalBody';
import { CatalogItem } from '@console/plugin-sdk';

interface QuickSearchModalProps {
  isOpen: boolean;
  namespace: string;
  closeModal: () => void;
  allCatalogItemsLoaded: boolean;
  searchCatalog: (query: string) => CatalogItem[];
}

const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  namespace,
  closeModal,
  searchCatalog,
  allCatalogItemsLoaded,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      variant={ModalVariant.medium}
      aria-label={t('topology~Quick search')}
      isOpen={isOpen}
      showClose={false}
      position="top"
      positionOffset="30%"
      hasNoBodyWrapper
    >
      <QuickSearchModalBody
        allCatalogItemsLoaded={allCatalogItemsLoaded}
        searchCatalog={searchCatalog}
        namespace={namespace}
        closeModal={closeModal}
      />
    </Modal>
  );
};

export default QuickSearchModal;
