import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';

import {CatalogTileView} from 'patternfly-react-extensions/dist/esm/components/CatalogTileView';
import {CatalogTile} from 'patternfly-react-extensions/dist/esm/components/CatalogTile';
import {normalizeIconClass} from './catalog-item-icon';
import {Link} from 'react-router-dom';

const CatalogItem = ({item}) => {
  const catalogTile = <CatalogTile
    id={item.obj.metadata.uid}
    key={item.obj.metadata.uid}
    title={item.tileName}
    iconImg={item.tileImgUrl}
    iconClass={item.tileIconClass ? `icon ${normalizeIconClass(item.tileIconClass)}` : null}
    vendor={item.tileProvider ? `Provided by ${item.tileProvider}` : null}
    description={item.tileDescription}
  />;
  return item.href ? <Link className="co-catalog-item-tile" to={item.href}>{catalogTile}</Link> : catalogTile;
};

CatalogItem.displayName = 'CatalogItem';

CatalogItem.propTypes = {
  item: PropTypes.shape({
    obj: PropTypes.object.isRequired,
    kind: PropTypes.string.isRequired,
    tileName: PropTypes.string.isRequired,
    tileIconClass: PropTypes.string,
    tileImgUrl: PropTypes.string,
    tileDescription: PropTypes.string.isRequired,
    tileProvider: PropTypes.string,
  }).isRequired
};

export const CatalogList = ({items}) =>
  <CatalogTileView>
    <CatalogTileView.Category key="all" title="All">
      {_.map(items, (item) => <CatalogItem key={item.obj.metadata.uid} item={item} />)}
    </CatalogTileView.Category>
  </CatalogTileView>;

CatalogList.displayName = 'CatalogList';

CatalogList.propTypes = {
  items: PropTypes.array.isRequired
};
