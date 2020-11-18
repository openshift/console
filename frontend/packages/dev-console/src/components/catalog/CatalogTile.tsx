import * as React from 'react';
import * as _ from 'lodash';
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
  if (!item) {
    return null;
  }
  const { uid, name, provider, description, type } = item;

  const vendor = provider ? `Provided by ${provider}` : null;
  const catalogType = _.find(catalogTypes, ['value', type]);

  const badges = [
    <CatalogTileBadge key="type">
      <Badge isRead>{catalogType?.label}</Badge>
    </CatalogTileBadge>,
  ];

  return (
    <PfCatalogTile
      className="co-catalog-tile"
      key={uid}
      onClick={() => onClick(item)}
      title={name}
      badges={badges}
      vendor={vendor}
      description={description}
      data-test={`${type}-${name}`}
      {...getIconProps(item)}
    />
  );
};

export default React.memo(CatalogTile);
