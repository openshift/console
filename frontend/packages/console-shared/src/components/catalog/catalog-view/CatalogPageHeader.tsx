import * as React from 'react';

type CatalogPageHeaderProps = {
  children: React.ReactNode;
};

const CatalogPageHeader: React.FCC<CatalogPageHeaderProps> = ({ children }) => (
  <div className="co-catalog-page__header">{children}</div>
);

export default CatalogPageHeader;
