import type { FC, MouseEvent } from 'react';
import { isValidElement } from 'react';
import { CatalogTile as PfCatalogTile } from '@patternfly/react-catalog-view-extension';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { isModifiedEvent } from '../../utils/utils';
import { CatalogBadges, CatalogHeaderBadges } from './CatalogBadges';
import { getIconProps, partitionBadgesByPlacement } from './utils/catalog-utils';
import type { CatalogType } from './utils/types';

import './CatalogTile.scss';

type CatalogTileProps = {
  item: CatalogItem;
  catalogTypes: CatalogType[];
  onClick?: (item: CatalogItem) => void;
  href?: string;
};

export const CatalogTile: FC<CatalogTileProps> = ({ item, catalogTypes, onClick, href }) => {
  const { t } = useTranslation('console-shared');
  const navigate = useNavigate();
  const { uid, name, title, provider, description, type, typeLabel, badges } = item;
  const vendor = provider ? t('Provided by {{provider}}', { provider }) : null;
  const catalogType = _.find(catalogTypes, ['value', type]);

  const [headerBadges, footerBadges] = partitionBadgesByPlacement(badges);

  const isDescriptionReactElement = isValidElement(description);
  return (
    <PfCatalogTile
      id={uid}
      className="odc-catalog-tile co-catalog-tile"
      onClick={(e: MouseEvent<HTMLElement>) => {
        if (isModifiedEvent(e)) return;
        e.preventDefault();
        if (onClick) {
          onClick(item);
        } else if (href) {
          navigate(href);
        }
      }}
      href={href}
      title={title || name}
      badges={[
        <CatalogHeaderBadges
          key="header-badges"
          typeLabel={typeLabel ?? catalogType?.label}
          badges={headerBadges}
        />,
      ]}
      vendor={vendor}
      description={isDescriptionReactElement ? undefined : description}
      data-test={`${type}-${name}`}
      {...getIconProps(item)}
    >
      {isDescriptionReactElement ? description : undefined}
      {footerBadges.length > 0 ? <CatalogBadges badges={footerBadges} /> : undefined}
    </PfCatalogTile>
  );
};
