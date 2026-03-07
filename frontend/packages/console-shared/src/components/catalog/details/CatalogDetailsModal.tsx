import type { FC } from 'react';
import { CatalogItemHeader } from '@patternfly/react-catalog-view-extension';
import {
  Split,
  SplitItem,
  Divider,
  Stack,
  StackItem,
  Modal,
  ModalBody,
  ModalHeader,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import type { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import CatalogBadges from '../CatalogBadges';
import { useCtaLink } from '../hooks/useCtaLink';
import { getIconProps } from '../utils/catalog-utils';
import CatalogDetailsPanel from './CatalogDetailsPanel';
import './CatalogDetailsModal.scss';

type CatalogDetailsModalProps = {
  item: CatalogItem;
  onClose: () => void;
};

const CatalogDetailsModal: FC<CatalogDetailsModalProps> = ({ item, onClose }) => {
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
    <CatalogItemHeader
      className="co-catalog-page__overlay-header"
      title={title || name}
      vendor={vendor}
      {...getIconProps(item)}
    />
  );

  return (
    <Modal
      className="ocs-modal co-catalog-page__overlay co-catalog-page__overlay--right"
      isOpen={!!item}
      onClose={onClose}
      aria-label={item.name}
    >
      <ModalHeader>{modalHeader}</ModalHeader>
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <Split className="odc-catalog-details-modal__header">
              <SplitItem>
                {to && (
                  <div className="co-catalog-page__overlay-actions">
                    <Link
                      data-test="catalog-details-modal-cta"
                      className="pf-v6-c-button pf-m-primary co-catalog-page__overlay-action"
                      to={to}
                      role="button"
                      onClick={onClose}
                    >
                      {label}
                    </Link>
                  </div>
                )}
              </SplitItem>
              <SplitItem isFilled />
              <SplitItem>
                {badges?.length > 0 ? <CatalogBadges badges={badges} /> : undefined}
              </SplitItem>
            </Split>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <CatalogDetailsPanel item={item} />
          </StackItem>
        </Stack>
      </ModalBody>
    </Modal>
  );
};

export default CatalogDetailsModal;
