import type { ReactNode } from 'react';
import { Flex } from '@patternfly/react-core';

type CatalogPageToolbarProps = {
  children: ReactNode;
};

const CatalogPageToolbar: Snail.FCC<CatalogPageToolbarProps> = ({ children }) => (
  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>{children}</Flex>
);

export default CatalogPageToolbar;
