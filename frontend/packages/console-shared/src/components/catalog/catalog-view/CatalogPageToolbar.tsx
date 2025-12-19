import * as React from 'react';
import { Flex } from '@patternfly/react-core';

type CatalogPageToolbarProps = {
  children: React.ReactNode;
};

const CatalogPageToolbar: Snail.FCC<CatalogPageToolbarProps> = ({ children }) => (
  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>{children}</Flex>
);

export default CatalogPageToolbar;
