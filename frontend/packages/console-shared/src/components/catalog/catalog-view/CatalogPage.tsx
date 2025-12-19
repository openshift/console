import type { ReactNode } from 'react';
import { Flex } from '@patternfly/react-core';

type CatalogPageProps = {
  children: ReactNode;
};

const CatalogPage: Snail.FCC<CatalogPageProps> = ({ children }) => (
  <Flex className="co-catalog-page" direction={{ default: 'column', md: 'row' }}>
    {children}
  </Flex>
);

export default CatalogPage;
