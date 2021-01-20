import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const queryParams = useQueryParams();

  if (!item) {
    return null;
  }

  const { href } = item.cta;
  const [url, params] = href.split('?');

  Object.values(CatalogQueryParams).map((q) => queryParams.delete(q)); // don't pass along catalog specific query params

  const to = params
    ? `${url}?${params}${queryParams.toString() !== '' ? `&${queryParams.toString()}` : ''}`
    : `${url}?${queryParams.toString()}`;

  const vendor = item.provider
    ? t('devconsole~Provided by {{provider}}', { provider: item.provider })
    : null;

  const modalHeader = (
    <>
      <CatalogItemHeader title={item.name} vendor={vendor} {...getIconProps(item)} />
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
