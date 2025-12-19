import * as React from 'react';
import { Flex } from '@patternfly/react-core';

type CatalogPageProps = {
  children: React.ReactNode;
};

const CatalogPage: Snail.FCC<CatalogPageProps> = ({ children }) => (
  <Flex className="co-catalog-page" direction={{ default: 'column', md: 'row' }}>
    {children}
  </Flex>
);

export default CatalogPage;
