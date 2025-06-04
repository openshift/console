import * as React from 'react';

type CatalogPageHeaderProps = {
  children: React.ReactNode;
};

const CatalogPageHeader: React.FC<CatalogPageHeaderProps> = ({ children }) => (
  <div className="co-catalog-page__header">{children}</div>
);

export default CatalogPageHeader;
