import * as React from 'react';
import { CatalogItemHeader } from '@patternfly/react-catalog-view-extension';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { Modal } from '@console/shared';
import CatalogBadges from '../CatalogBadges';
import useCtaLink from '../hooks/useCtaLink';
import { getIconProps } from '../utils/catalog-utils';
import CatalogDetailsPanel from './CatalogDetailsPanel';

type CatalogDetailsModalProps = {
  item: CatalogItem;
  onClose: () => void;
};

const CatalogDetailsModal: React.FC<CatalogDetailsModalProps> = ({ item, onClose }) => {
  const { t } = useTranslation();
  const [to, label] = useCtaLink(item?.cta);

  if (!item) {
    return null;
  }

  const { name, title, badges } = item;

  const provider = item.provider
    ? t('devconsole~Provided by {{provider}}', { provider: item.provider })
    : null;

  const vendor = (
    <div>
      {provider}
      {badges?.length > 0 ? <CatalogBadges badges={badges} /> : undefined}
    </div>
  );

  const modalHeader = (
    <>
      <CatalogItemHeader
        className="co-catalog-page__overlay-header"
        title={title || name}
        vendor={vendor}
        {...getIconProps(item)}
      />
      {to && (
        <div className="co-catalog-page__overlay-actions">
          <Link
            className="pf-c-button pf-m-primary co-catalog-page__overlay-action"
            to={to}
            role="button"
            onClick={onClose}
          >
            {label}
          </Link>
        </div>
      )}
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
