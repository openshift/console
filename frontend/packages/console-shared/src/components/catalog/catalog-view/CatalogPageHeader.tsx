import type { FC, ReactNode } from 'react';

type CatalogPageHeaderProps = {
  children: ReactNode;
};

const CatalogPageHeader: FC<CatalogPageHeaderProps> = ({ children }) => (
  <div className="co-catalog-page__header">{children}</div>
);

export default CatalogPageHeader;
