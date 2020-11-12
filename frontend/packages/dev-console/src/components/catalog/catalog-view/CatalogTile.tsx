import * as React from 'react';
import * as _ from 'lodash';
import {
  CatalogTileBadge,
  CatalogTile as PfCatalogTile,
} from '@patternfly/react-catalog-view-extension';
import { Badge } from '@patternfly/react-core';
import { CatalogItem } from '@console/plugin-sdk';
import { getIconProps } from '../utils/utils';

type CatalogTileProps = {
  item: CatalogItem;
  getAvailableFilters: (initialFilters) => any;
  onClick: (item: CatalogItem) => void;
};

const CatalogTile: React.FC<CatalogTileProps> = ({ item, getAvailableFilters, onClick }) => {
  if (!item) {
    return null;
  }
  const { uid, name, provider, description, type } = item;

  const vendor = provider ? `Provided by ${provider}` : null;
  const { type: filters } = getAvailableFilters({ type });
  const filter = _.find(filters, ['value', type]);

  return (
    <PfCatalogTile
      className="co-catalog-tile"
      key={uid}
      onClick={() => onClick(item)}
      title={name}
      badges={[
        <CatalogTileBadge key="type">
          <Badge isRead>{filter.label}</Badge>
        </CatalogTileBadge>,
      ]}
      {...getIconProps(item)}
      vendor={vendor}
      description={description}
      data-test={`${type}-${name}`}
    />
  );
};

export default React.memo(CatalogTile);
