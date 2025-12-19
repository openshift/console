import type { ReactNode } from 'react';
import { FlexItem } from '@patternfly/react-core';

type CatalogPageNumItemsProps = {
  children: ReactNode;
};

const CatalogPageNumItems: Snail.FCC<CatalogPageNumItemsProps> = ({ children }) => (
  <FlexItem className="co-catalog-page__num-items">{children}</FlexItem>
);

export default CatalogPageNumItems;
