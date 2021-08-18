import * as React from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useBoundingClientRect } from '../../hooks';
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
  const clientRect = useBoundingClientRect(viewContainer);
  const maxHeight = clientRect?.height;
  const maxWidth = clientRect?.width;

  return viewContainer ? (
    <Modal
      className="ocs-quick-search-modal"
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
        limitItemCount={limitItemCount}
        icon={icon}
        detailsRenderer={detailsRenderer}
        maxDimension={{ maxHeight, maxWidth }}
        viewContainer={viewContainer}
      />
    </Modal>
  ) : null;
};

export default QuickSearchModal;
