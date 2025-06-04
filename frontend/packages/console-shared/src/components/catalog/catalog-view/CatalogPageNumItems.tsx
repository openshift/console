import * as React from 'react';
import { FlexItem } from '@patternfly/react-core';

type CatalogPageNumItemsProps = {
  children: React.ReactNode;
};

const CatalogPageNumItems: React.FC<CatalogPageNumItemsProps> = ({ children }) => (
  <FlexItem className="co-catalog-page__num-items">{children}</FlexItem>
);

export default CatalogPageNumItems;
