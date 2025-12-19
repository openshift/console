import * as React from 'react';
import { FlexItem } from '@patternfly/react-core';

type CatalogPageTabsProps = {
  children: React.ReactNode;
};

const CatalogPageTabs: Snail.FCC<CatalogPageTabsProps> = ({ children }) => (
  <FlexItem className="co-catalog-page__tabs" order={{ default: '2', md: '1' }}>
    {children}
  </FlexItem>
);

export default CatalogPageTabs;
