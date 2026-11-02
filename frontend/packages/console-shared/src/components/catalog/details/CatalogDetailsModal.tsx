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
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { CatalogBadges, CatalogHeaderBadges } from '../CatalogBadges';
import { useCtaLink } from '../hooks/useCtaLink';
import { getIconProps, partitionBadgesByPlacement } from '../utils/catalog-utils';
import type { CatalogType } from '../utils/types';
import { CatalogDetailsPanel } from './CatalogDetailsPanel';
import './CatalogDetailsModal.scss';

type CatalogDetailsModalProps = {
  item: CatalogItem;
  catalogTypes?: CatalogType[];
  onClose: () => void;
};

export const CatalogDetailsModal: FC<CatalogDetailsModalProps> = ({
  item,
  catalogTypes,
  onClose,
}) => {
  const { t } = useTranslation('console-shared');
  const [to, label] = useCtaLink(item?.cta);

  if (!item) {
    return null;
  }

  const { name, title, type, typeLabel, badges } = item;
  const catalogType = _.find(catalogTypes, ['value', type]);
  const [headerBadges, footerBadges] = partitionBadgesByPlacement(badges);

  const provider = item.provider
    ? t('Provided by {{provider}}', { provider: item.provider })
    : null;

  const vendor = <div>{provider}</div>;

  const modalHeader = (
    <Split>
      <SplitItem isFilled>
        <CatalogItemHeader
          className="co-catalog-page__overlay-header"
          title={title || name}
          vendor={vendor}
          {...getIconProps(item)}
        />
      </SplitItem>
      <SplitItem>
        <CatalogHeaderBadges typeLabel={typeLabel ?? catalogType?.label} badges={headerBadges} />
      </SplitItem>
    </Split>
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
                {footerBadges.length > 0 ? <CatalogBadges badges={footerBadges} /> : undefined}
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
