import type { FC, ReactNode } from 'react';
import { FlexItem } from '@patternfly/react-core';

type CatalogPageTabsProps = {
  children: ReactNode;
};

const CatalogPageTabs: FC<CatalogPageTabsProps> = ({ children }) => (
  <FlexItem className="co-catalog-page__tabs" order={{ default: '2', md: '1' }}>
    {children}
  </FlexItem>
);

export default CatalogPageTabs;
