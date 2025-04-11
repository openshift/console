import * as React from 'react';
import { FlexItem } from '@patternfly/react-core';

type CatalogPageOverlayDescriptionProps = {
  children: React.ReactNode;
};

const CatalogPageOverlayDescription: React.FC<CatalogPageOverlayDescriptionProps> = ({
  children,
}) => (
  <FlexItem
    className="co-catalog-page__overlay-description pf-v6-u-mt-md pf-v6-u-mt-0-on-md pf-v6-u-ml-lg-on-md"
    flex={{ md: 'flex_1' }}
  >
    {children}
  </FlexItem>
);

export default CatalogPageOverlayDescription;
