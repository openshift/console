import * as React from 'react';
import {
  CatalogTileBadge,
  CatalogTile as PfCatalogTile,
} from '@patternfly/react-catalog-view-extension';
import { Badge } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { history } from '@console/internal/components/utils';
import { isModifiedEvent } from '@console/shared';
import CatalogBadges from './CatalogBadges';
import { getIconProps } from './utils/catalog-utils';
import { CatalogType } from './utils/types';

import './CatalogTile.scss';

type CatalogTileProps = {
  item: CatalogItem;
  catalogTypes: CatalogType[];
  onClick?: (item: CatalogItem) => void;
  href?: string;
};

const CatalogTile: React.FC<CatalogTileProps> = ({ item, catalogTypes, onClick, href }) => {
  const { t } = useTranslation();
  const { name, title, provider, description, type, badges } = item;

  const vendor = provider ? t('devconsole~Provided by {{provider}}', { provider }) : null;
  const catalogType = _.find(catalogTypes, ['value', type]);

  const typeBadges = [
    <CatalogTileBadge>
      <Badge isRead>{catalogType?.label}</Badge>
    </CatalogTileBadge>,
  ];

  const isDescriptionReactElement = React.isValidElement(description);
  return (
    <PfCatalogTile
      className="odc-catalog-tile co-catalog-tile"
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        if (isModifiedEvent(e)) return;
        e.preventDefault();
        if (onClick) {
          onClick(item);
        } else if (href) {
          history.push(href);
        }
      }}
      href={href}
      title={title || name}
      badges={typeBadges}
      vendor={vendor}
      description={isDescriptionReactElement ? undefined : description}
      data-test={`${type}-${name}`}
      {...getIconProps(item)}
    >
      {isDescriptionReactElement ? description : undefined}
      {badges?.length > 0 ? <CatalogBadges badges={badges} /> : undefined}
    </PfCatalogTile>
  );
};

export default React.memo(CatalogTile);
