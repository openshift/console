import * as React from 'react';

// 12 works well because it divides evenly for 2, 3, and 4 column layouts
const skeletonTiles = Array.from({ length: 12 }, (_, k: number) => (
  <div key={k} className="skeleton-catalog--tile" />
));
export const skeletonCatalog = (
  <div className="loading-skeleton--catalog">
    <div className="skeleton-catalog--list" />
    <div className="skeleton-catalog--grid">{skeletonTiles}</div>
  </div>
);
