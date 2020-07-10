import * as React from 'react';
import * as _ from 'lodash';
import {
  CatalogTileBadge,
  CatalogTile as PfCatalogTile,
} from '@patternfly/react-catalog-view-extension';
import { Badge } from '@patternfly/react-core';
import { Item } from './types';
import { getAvailableFilters, getIconProps } from './utils';

type CatalogTileProps = {
  item: Item;
  onClick: (item: Item) => void;
};

const CatalogTile: React.FC<CatalogTileProps> = ({ item, onClick }) => {
  if (!item) {
    return null;
  }
  const { obj, tileName, tileProvider, tileDescription, kind } = item;
  const uid = obj.metadata.uid;
  const vendor = tileProvider ? `provided by ${tileProvider}` : null;
  const { kind: filters } = getAvailableFilters({ kind });
  const filter = _.find(filters, ['value', kind]);
  return (
    <PfCatalogTile
      className="co-catalog-tile"
      key={uid}
      onClick={() => onClick(item)}
      title={tileName}
      badges={[
        <CatalogTileBadge key="type">
          <Badge isRead>{filter.label}</Badge>
        </CatalogTileBadge>,
      ]}
      {...getIconProps(item)}
      vendor={vendor}
      description={tileDescription}
      data-test={`${kind}-${obj.metadata.name}`}
    />
  );
};

export default React.memo(CatalogTile);
