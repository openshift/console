import * as React from 'react';
import { CatalogItemHeader } from '@patternfly/react-catalog-view-extension';
import { Split, SplitItem, Button, ButtonVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { Modal } from '../../modal';
import CatalogBadges from '../CatalogBadges';
import { useCtaLinks } from '../hooks/useCtaLink';
import { getIconProps } from '../utils/catalog-utils';
import CatalogDetailsPanel from './CatalogDetailsPanel';

import './CatalogDetailsModal.scss';

type CatalogDetailsModalProps = {
  item: CatalogItem;
  onClose: () => void;
};

const CatalogDetailsModal: React.FC<CatalogDetailsModalProps> = ({ item, onClose }) => {
  const { t } = useTranslation();
  // Support for both single and multiple CTAs
  const ctaLinks = useCtaLinks(item?.cta, item?.ctas);

  if (!item) {
    return null;
  }

  const { name, title, badges } = item;

  const provider = item.provider
    ? t('console-shared~Provided by {{provider}}', { provider: item.provider })
    : null;

  const vendor = <div>{provider}</div>;

  const getButtonVariant = (variant?: string): ButtonVariant => {
    switch (variant) {
      case 'secondary':
        return ButtonVariant.secondary;
      case 'link':
        return ButtonVariant.link;
      default:
        return ButtonVariant.primary;
    }
  };

  const renderAction = (ctaLink, index: number) => {
    const { to, label, callback, variant } = ctaLink;

    if (!to && !callback) {
      return null;
    }

    const handleClick = () => {
      if (callback) {
        callback();
      }
      onClose();
    };

    // If there's a callback and no href, render as a button
    if (callback && !to) {
      return (
        <Button
          key={index}
          variant={getButtonVariant(variant)}
          className="co-catalog-page__overlay-action"
          onClick={handleClick}
        >
          {label}
        </Button>
      );
    }

    // If there's an href, render as a link
    if (to) {
      return (
        <Link
          key={index}
          className={`pf-v6-c-button pf-m-${variant || 'primary'} co-catalog-page__overlay-action`}
          to={to}
          role="button"
          onClick={onClose}
        >
          {label}
        </Link>
      );
    }

    return null;
  };

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
          {ctaLinks.length > 0 && (
            <div className="co-catalog-page__overlay-actions">
              {ctaLinks.map((ctaLink, index) => renderAction(ctaLink, index))}
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
      isOpen={!!item}
      onClose={onClose}
      aria-label={item.name}
      header={modalHeader}
    >
      <CatalogDetailsPanel item={item} />
    </Modal>
  );
};

export default CatalogDetailsModal;
