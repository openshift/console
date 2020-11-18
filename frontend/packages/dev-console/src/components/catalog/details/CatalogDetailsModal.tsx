import * as React from 'react';
import { Link } from 'react-router-dom';
import { CatalogItem } from '@console/plugin-sdk';
import { Modal, useQueryParams } from '@console/shared';
import { CatalogItemHeader } from '@patternfly/react-catalog-view-extension';
import { getIconProps } from '../utils/catalog-utils';
import { CatalogQueryParams } from '../utils/types';
import CatalogDetailsPanel from './CatalogDetailsPanel';

type CatalogDetailsModalProps = {
  item: CatalogItem;
  onClose: () => void;
};

const CatalogDetailsModal: React.FC<CatalogDetailsModalProps> = ({ item, onClose }) => {
  const queryParams = useQueryParams();

  if (!item) {
    return null;
  }

  const { href } = item.cta;
  const [url, params] = href.split('?');

  Object.values(CatalogQueryParams).map((q) => queryParams.delete(q)); // don't pass along catalog specific query params

  const to = params
    ? `${url}?${params}&${queryParams.toString()}`
    : `${url}?${queryParams.toString()}`;

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
          to={to}
          role="button"
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
