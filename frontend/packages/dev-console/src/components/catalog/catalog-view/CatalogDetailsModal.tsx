import * as React from 'react';
import { Link } from 'react-router-dom';
import { CatalogItem } from '@console/plugin-sdk';
import { Modal } from '@console/shared';
import { CatalogItemHeader } from '@patternfly/react-catalog-view-extension';
import { getIconProps } from '../utils/utils';
import CatalogDetailsPanel from './CatalogDetailsPanel';

type CatalogDetailsModalProps = {
  item: CatalogItem;
  onClose: () => void;
};

const CatalogDetailsModal: React.FC<CatalogDetailsModalProps> = ({ item, onClose }) => {
  if (!item) {
    return null;
  }

  const modalHeader = (
    <>
      <CatalogItemHeader
        title={item.name}
        vendor={item.provider ? `Provided by ${item.provider}` : null}
        {...getIconProps(item)}
      />
      <div className="co-catalog-page__overlay-actions">
        <Link
          className="pf-c-button pf-m-primary co-catalog-page__overlay-action"
          to={item.cta.href}
          role="button"
          title={item.cta.label}
          onClick={onClose}
        >
          {item.cta.label}
        </Link>
      </div>
    </>
  );

  return (
    <Modal
      className="co-catalog-page__overlay co-catalog-page__overlay--right"
      header={modalHeader}
      isOpen={!!item}
      onClose={onClose}
      title={item.name}
      aria-label={item.name}
    >
      <CatalogDetailsPanel item={item} />
    </Modal>
  );
};

export default CatalogDetailsModal;
