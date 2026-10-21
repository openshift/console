import type { FC, ReactNode } from 'react';
import { FlexItem } from '@patternfly/react-core';

type CatalogPageContentProps = {
  children: ReactNode;
};

const CatalogPageContent: FC<CatalogPageContentProps> = ({ children }) => (
  <FlexItem
    className="co-catalog-page__content"
    grow={{ default: 'grow' }}
    order={{ default: '1', md: '2' }}
  >
    {children}
  </FlexItem>
);

export default CatalogPageContent;
