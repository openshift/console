import * as React from 'react';
import { Title, TitleSizes } from '@patternfly/react-core';

type CatalogPageHeadingProps = {
  children: React.ReactNode;
};

const CatalogPageHeading: Snail.FCC<CatalogPageHeadingProps> = ({ children }) => (
  <Title
    headingLevel="h2"
    size={TitleSizes.lg}
    className="pf-v6-u-mb-md"
    data-test="catalog-heading"
  >
    {children}
  </Title>
);

export default CatalogPageHeading;
