import type { ReactNode } from 'react';

type CatalogPageHeaderProps = {
  children: ReactNode;
};

const CatalogPageHeader: React.FCC<CatalogPageHeaderProps> = ({ children }) => (
  <div className="co-catalog-page__header">{children}</div>
);

export default CatalogPageHeader;
