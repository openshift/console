import type { FC, ReactNode } from 'react';
import { Flex } from '@patternfly/react-core';

type CatalogPageProps = {
  children: ReactNode;
};

const CatalogPage: FC<CatalogPageProps> = ({ children }) => (
  <Flex className="co-catalog-page" direction={{ default: 'column', md: 'row' }}>
    {children}
  </Flex>
);

export default CatalogPage;
