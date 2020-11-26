import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  CatalogTileBadge,
  CatalogTile as PfCatalogTile,
} from '@patternfly/react-catalog-view-extension';
import { Badge } from '@patternfly/react-core';
import { CatalogItem } from '@console/plugin-sdk';
import { getIconProps } from './utils/catalog-utils';
import { CatalogType } from './utils/types';

type CatalogTileProps = {
  item: CatalogItem;
  catalogTypes: CatalogType[];
  onClick: (item: CatalogItem) => void;
};

const CatalogTile: React.FC<CatalogTileProps> = ({ item, catalogTypes, onClick }) => {
  const { t } = useTranslation();
  const { name, provider, description, type } = item;

  const vendor = provider ? t('devconsole~Provided by {{provider}}', { provider }) : null;
  const catalogType = _.find(catalogTypes, ['value', type]);

  const badges = [
    <CatalogTileBadge>
      <Badge isRead>{catalogType?.label}</Badge>
    </CatalogTileBadge>,
  ];

  const isDescriptionReactElement = React.isValidElement(description);
  return (
    <PfCatalogTile
      className="co-catalog-tile"
      onClick={() => onClick(item)}
      title={name}
      badges={badges}
      vendor={vendor}
      description={isDescriptionReactElement ? undefined : description}
      data-test={`${type}-${name}`}
      {...getIconProps(item)}
    >
      {isDescriptionReactElement ? description : undefined}
    </PfCatalogTile>
  );
};

export default React.memo(CatalogTile);
