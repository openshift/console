import * as React from 'react';
import { FlexItem } from '@patternfly/react-core';

type CatalogPageContentProps = {
  children: React.ReactNode;
};

const CatalogPageContent: React.FCC<CatalogPageContentProps> = ({ children }) => (
  <FlexItem
    className="co-catalog-page__content"
    grow={{ default: 'grow' }}
    order={{ default: '1', md: '2' }}
  >
    {children}
  </FlexItem>
);

export default CatalogPageContent;
