import type { ReactNode } from 'react';
import { Flex } from '@patternfly/react-core';

type CatalogPageOverlayProps = {
  children: ReactNode;
};

const CatalogPageOverlay: Snail.FCC<CatalogPageOverlayProps> = ({ children }) => (
  <Flex
    className="pf-v6-u-mt-md"
    alignItems={{ md: 'alignItemsFlexStart' }}
    direction={{ default: 'column', md: 'row' }}
    columnGap={{ default: 'columnGapNone' }}
  >
    {children}
  </Flex>
);

export default CatalogPageOverlay;
