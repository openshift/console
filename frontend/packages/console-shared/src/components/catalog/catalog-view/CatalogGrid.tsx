import * as React from 'react';
import { Title } from '@patternfly/react-core';
import * as _ from 'lodash';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { VirtualizedGrid } from '../../virtualized-grid';

type CatalogGridProps = {
  items: CatalogItem[] | { [key: string]: CatalogItem[] };
  renderTile: (item: CatalogItem) => React.ReactNode;
  isGrouped: boolean;
};

const CatalogGrid: React.FC<CatalogGridProps> = ({ items, renderTile, isGrouped }) => {
  const renderGroupHeader = (heading) => (
    <Title className="co-catalog-page__group-title" headingLevel="h2" size="lg">
      {heading} ({_.size(items[heading])})
    </Title>
  );

  return (
    <VirtualizedGrid
      items={items}
      renderCell={renderTile}
      renderHeader={renderGroupHeader}
      isItemsGrouped={isGrouped}
    />
  );
};

export default CatalogGrid;
