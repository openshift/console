import * as React from 'react';
import { CatalogItemHeader } from '@patternfly/react-catalog-view-extension';
import { Split, SplitItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { Modal } from '../../modal';
import CatalogBadges from '../CatalogBadges';
import useCtaLink from '../hooks/useCtaLink';
import { getIconProps } from '../utils/catalog-utils';
import CatalogDetailsPanel from './CatalogDetailsPanel';

import './CatalogDetailsModal.scss';

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
    ? t('console-shared~Provided by {{provider}}', { provider: item.provider })
    : null;

  const vendor = <div>{provider}</div>;

  const modalHeader = (
    <>
      <CatalogItemHeader
        className="co-catalog-page__overlay-header"
        title={title || name}
        vendor={vendor}
        {...getIconProps(item)}
      />
      <Split className="odc-catalog-details-modal__header">
        <SplitItem>
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
        </SplitItem>
        <SplitItem>{badges?.length > 0 ? <CatalogBadges badges={badges} /> : undefined}</SplitItem>
      </Split>
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
